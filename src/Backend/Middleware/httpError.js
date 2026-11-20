import { NextResponse } from "next/server";

export function jsonOk(body, init = {}) {
  return NextResponse.json(body, { status: 200, ...init });
}

export function jsonError(error, status = 500) {
  const message = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ error: message }, { status });
}
