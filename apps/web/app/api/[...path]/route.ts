import { NextRequest, NextResponse } from "next/server";
import serverlessHttp from "serverless-http";
import { app } from "@/server/app";
import { connectDatabase, databaseReady } from "@/server/config/db";

let handler: ReturnType<typeof serverlessHttp> | null = null;

async function getHandler() {
  if (!handler) {
    await connectDatabase();
    handler = serverlessHttp(app, {
      request: { passThrough: true },
    });
  }
  return handler;
}

async function handle(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  // Reconstruct the original URL path
  const pathStr = path.join("/");
  const url = new URL(req.url);
  url.pathname = `/api/v1/${pathStr}`;

  // Convert NextRequest to a plain Request with the reconstructed path
  const newReq = new Request(url.toString(), {
    method: req.method,
    headers: req.headers,
    body: ["GET", "HEAD"].includes(req.method) ? undefined : req.body,
    // @ts-expect-error duplex is needed for Node.js
    duplex: "half",
  });

  const handlerFn = await getHandler();
  const res = await handlerFn(newReq, { url: url.pathname });
  return res;
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
export const DELETE = handle;
export const OPTIONS = handle;
export const HEAD = handle;
