import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

const SECRET = process.env.REVALIDATION_SECRET || "";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("x-revalidate-secret") || "";
  if (!SECRET || authHeader !== SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { tags?: string[]; tag?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const tags = body.tags || (body.tag ? [body.tag] : []);
  if (!tags.length) {
    return NextResponse.json({ error: "No tags provided" }, { status: 400 });
  }

  for (const tag of tags) {
    revalidateTag(tag, {});
  }

  return NextResponse.json({ revalidated: true, tags });
}
