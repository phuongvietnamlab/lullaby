import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET: Return a blog post for preview (even if unpublished)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Simple token-based or admin access check
    // In production, validate admin session here
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    // Accept requests with preview token or from admin (no strict auth for now)
    if (!token && !request.headers.get("cookie")?.includes("session")) {
      // Allow anyway for development, in prod add proper auth
    }

    const post = await db.blogPost.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, nameEn: true } },
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Failed to fetch preview:", error);
    return NextResponse.json(
      { error: "Failed to fetch preview" },
      { status: 500 }
    );
  }
}
