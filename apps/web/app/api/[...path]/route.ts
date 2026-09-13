import { NextRequest, NextResponse } from "next/server";
import { app } from "@/server/app";
import { connectDatabase } from "@/server/config/db";

let dbConnected = false;

async function ensureDb() {
  if (!dbConnected) {
    await connectDatabase();
    dbConnected = true;
  }
}

function makeCookie(name: string, value: string, options: Record<string, unknown>) {
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

function wrapNextResponse(
  body: string | Buffer | null,
  statusCode: number,
  resHeaders: Record<string, string>,
  setCookies: { name: string; value: string; options: Record<string, unknown> }[],
  clearCookies: { name: string; options: Record<string, unknown> }[]
): NextResponse {
  const content = body
    ? new NextResponse(Buffer.isBuffer(body) ? new Uint8Array(body) : body, { status: statusCode })
    : new NextResponse(null, { status: statusCode });

  for (const [k, v] of Object.entries(resHeaders)) {
    if (k === "set-cookie") continue;
    content.headers.set(k, v);
  }
  for (const c of setCookies) {
    content.headers.append("set-cookie", makeCookie(c.name, c.value, c.options));
  }
  for (const c of clearCookies) {
    content.headers.append("set-cookie", makeCookie(c.name, "", { ...c.options, maxAge: 0 }));
  }

  return content;
}

async function handler(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params;
  const pathStr = path.join("/");
  const url = new URL(req.url);
  url.pathname = `/api/${pathStr}`;

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

  const xff = req.headers.get("x-forwarded-for");
  const clientIp = xff?.split(",")[0]?.trim() || "127.0.0.1";

  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => { headers[k] = v; });

  const fakeSocket = {
    remoteAddress: clientIp,
    address() { return { address: clientIp, family: "IPv4", port: 0 }; },
    destroy() {},
    setTimeout() {},
    setNoDelay() {},
    setKeepAlive() {},
    ref() {},
    unref() {},
  };

  const nodeReq = new (require("http").IncomingMessage)(fakeSocket) as any;
  nodeReq.method = req.method;
  nodeReq.url = url.pathname + url.search;
  nodeReq.headers = headers;

  if (bodyBuffer && bodyBuffer.length > 0) {
    nodeReq.push(bodyBuffer);
    nodeReq.push(null);
  } else {
    nodeReq.push(null);
  }

  return new Promise<NextResponse>((resolve) => {
    const resHeaders: Record<string, string> = {};
    let statusCode = 200;
    const responseChunks: Buffer[] = [];
    let resolved = false;
    const setCookies: { name: string; value: string; options: Record<string, unknown> }[] = [];
    const clearCookies: { name: string; options: Record<string, unknown> }[] = [];

    function finalize(data: string | Buffer | null) {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      delete resHeaders["transfer-encoding"];
      delete resHeaders["connection"];
      resHeaders["content-type"] = resHeaders["content-type"] || "application/json";
      resolve(wrapNextResponse(data, statusCode, resHeaders, setCookies, clearCookies));
    }

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
        finalize(JSON.stringify(data));
        return fakeRes;
      },
      send(data: string | Buffer) {
        finalize(data);
        return fakeRes;
      },
      end(data?: string | Buffer) {
        if (data) responseChunks.push(Buffer.isBuffer(data) ? data : Buffer.from(data));
        finalize(responseChunks.length > 0 ? Buffer.concat(responseChunks) : null);
      },
      write(chunk: string | Buffer) {
        responseChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        return true;
      },
      get statusCode() { return statusCode; },
      set statusCode(v: number) { statusCode = v; },
    } as any;

    const timer = setTimeout(() => {
      finalize(responseChunks.length > 0 ? Buffer.concat(responseChunks) : null);
    }, 30000);

    app(nodeReq, fakeRes, () => {
      finalize(responseChunks.length > 0 ? Buffer.concat(responseChunks) : null);
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
