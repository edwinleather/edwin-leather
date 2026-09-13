import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import { app } from "@/server/app";
import { connectDatabase } from "@/server/config/db";

let dbConnected = false;

async function ensureDb() {
  if (!dbConnected) {
    await connectDatabase();
    dbConnected = true;
  }
}

async function handler(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params;
  const pathStr = path.join("/");
  const url = new URL(req.url);
  url.pathname = `/api/${pathStr}`;

  // Buffer the full body so Express middleware (json, raw) can parse it,
  // and Razorpay webhook can verify the raw signature bytes.
  let bodyBuffer: Buffer | null = null;
  if (!["GET", "HEAD"].includes(req.method) && req.body) {
    const reader = req.body.getReader();
    const chunks: Uint8Array[] = [];
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
    } catch { /* stream aborted */ }
    bodyBuffer = Buffer.concat(chunks);
  }

  await ensureDb();

  // Derive a plausible client IP from x-forwarded-for (Vercel sets this)
  const xff = req.headers.get("x-forwarded-for");
  const clientIp = xff?.split(",")[0]?.trim() || "127.0.0.1";

  // Build a Node.js-compatible IncomingMessage
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => { headers[k] = v; });

  const nodeReq = Object.assign(new Readable(), {
    method: req.method,
    url: url.pathname + url.search,
    headers,
    httpVersion: "1.1",
    socket: { remoteAddress: clientIp, destroy() {}, setTimeout() {}, setNoDelay() {}, setKeepAlive() {}, ref() {}, unref() {} },
    connection: { remoteAddress: clientIp, destroy() {}, setTimeout() {}, setNoDelay() {}, setKeepAlive() {}, ref() {}, unref() {} },
  }) as any;

  // Pre-parse the body and set it directly on the request so Express
  // body-parser (raw-body) doesn't try to re-read the stream.
  if (bodyBuffer && bodyBuffer.length > 0) {
    const ct = headers["content-type"] || "";
    if (ct.includes("application/json")) {
      try { nodeReq.body = JSON.parse(bodyBuffer.toString()); }
      catch { nodeReq.body = bodyBuffer; }
    } else if (ct.includes("application/x-www-form-urlencoded")) {
      nodeReq.body = Object.fromEntries(new URLSearchParams(bodyBuffer.toString()));
    } else {
      nodeReq.body = bodyBuffer;
    }
    nodeReq.rawBody = bodyBuffer;
    nodeReq._body = true;
  } else {
    nodeReq.body = {};
    nodeReq._body = true;
  }

  function buildCookieHeader(name: string, value: string, options: Record<string, unknown>) {
    let str = `${name}=${encodeURIComponent(value)}`;
    if (options.path) str += `; Path=${options.path}`;
    if (options.maxAge) str += `; Max-Age=${Math.round(Number(options.maxAge) / 1000)}`;
    if (options.expires) str += `; Expires=${new Date(options.expires as string | number).toUTCString()}`;
    if (options.domain) str += `; Domain=${options.domain}`;
    if (options.httpOnly) str += "; HttpOnly";
    if (options.secure) str += "; Secure";
    if (options.sameSite) str += `; SameSite=${String(options.sameSite).charAt(0).toUpperCase() + String(options.sameSite).slice(1)}`;
    return str;
  }

  function buildFinalHeaders(resHeaders: Record<string, string>, setCookies: { name: string; value: string; options: Record<string, unknown> }[], clearCookies: { name: string; options: Record<string, unknown> }[]): Headers {
    const h = new Headers();
    for (const [k, v] of Object.entries(resHeaders)) h.set(k, v);
    for (const c of setCookies) h.append("set-cookie", buildCookieHeader(c.name, c.value, c.options));
    for (const c of clearCookies) h.append("set-cookie", buildCookieHeader(c.name, "", { ...c.options, maxAge: 0 }));
    return h;
  }

  return new Promise<NextResponse>((resolve) => {
    const resHeaders: Record<string, string> = {};
    let statusCode = 200;
    const chunks: Buffer[] = [];
    let resolved = false;
    const setCookies: { name: string; value: string; options: Record<string, unknown> }[] = [];
    const clearCookies: { name: string; options: Record<string, unknown> }[] = [];

    const fakeRes = {
      status(code: number) { statusCode = code; return fakeRes; },
      set(key: string, val: string) { resHeaders[key] = val; return fakeRes; },
      setHeader(key: string, val: string | number | readonly string[]) {
        resHeaders[key.toLowerCase()] = String(val);
        return fakeRes;
      },
      getHeader(key: string) { return resHeaders[key.toLowerCase()]; },
      removeHeader(key: string) { delete resHeaders[key.toLowerCase()]; return fakeRes; },
      writeHead(code: number, h?: Record<string, string>) {
        statusCode = code;
        if (h) Object.assign(resHeaders, h);
        return fakeRes;
      },
      cookie(name: string, value: string, options: Record<string, unknown>) {
        setCookies.push({ name, value, options });
        return fakeRes;
      },
      clearCookie(name: string, options: Record<string, unknown>) {
        clearCookies.push({ name, options });
        return fakeRes;
      },
      json(data: unknown) {
        if (resolved) return fakeRes;
        resolved = true;
        clearTimeout(timer);
        resHeaders["content-type"] = resHeaders["content-type"] || "application/json";
        resolve(NextResponse.json(data, { status: statusCode, headers: buildFinalHeaders(resHeaders, setCookies, clearCookies) }));
        return fakeRes;
      },
      send(data: string | Buffer) {
        if (resolved) return fakeRes;
        resolved = true;
        clearTimeout(timer);
        const body = Buffer.isBuffer(data) ? data : Buffer.from(data);
        resolve(new NextResponse(new Uint8Array(body), {
          status: statusCode,
          headers: buildFinalHeaders({ ...resHeaders, "content-type": resHeaders["content-type"] || "text/plain" }, setCookies, clearCookies),
        }));
        return fakeRes;
      },
      end(data?: string | Buffer) {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);
        if (data) chunks.push(Buffer.isBuffer(data) ? data : Buffer.from(data));
        const body = Buffer.concat(chunks);
        delete resHeaders["transfer-encoding"];
        delete resHeaders["connection"];
        resolve(new NextResponse(body.length > 0 ? new Uint8Array(body) : null, {
          status: statusCode,
          headers: buildFinalHeaders(resHeaders, setCookies, clearCookies),
        }));
      },
      write(chunk: string | Buffer) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        return true;
      },
      get statusCode() { return statusCode; },
      set statusCode(v: number) { statusCode = v; },
    } as any;

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        const body = Buffer.concat(chunks);
        resolve(new NextResponse(body.length > 0 ? new Uint8Array(body) : null, {
          status: statusCode,
          headers: resHeaders,
        }));
      }
    }, 30000);

    app(nodeReq as any, fakeRes, () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        const body = Buffer.concat(chunks);
        delete resHeaders["transfer-encoding"];
        delete resHeaders["connection"];
        resolve(new NextResponse(body.length > 0 ? new Uint8Array(body) : null, {
          status: statusCode,
          headers: resHeaders,
        }));
      }
    });
  });
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
export const OPTIONS = handler;
export const HEAD = handler;
