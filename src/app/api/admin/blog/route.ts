import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Helper: save a revision snapshot of a blog post
async function saveRevision(
  postId: string,
  data: Record<string, unknown>,
  note?: string,
  createdBy?: string
) {
  await db.contentRevision.create({
    data: {
      entityType: "blog_post",
      entityId: postId,
      data: data as object,
      createdBy: createdBy || null,
      note: note || null,
    },
  });
}

// Helper: determine post status label
function getPostStatus(post: { isPublished: boolean; scheduledAt: Date | null }) {
  if (post.isPublished) return "published";
  if (post.scheduledAt && post.scheduledAt > new Date()) return "scheduled";
  return "draft";
}

// GET: Fetch all blog posts with author and category info
export async function GET() {
  try {
    const posts = await db.blogPost.findMany({
      include: {
        author: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true, nameEn: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Add status field to each post
    const postsWithStatus = posts.map((post: { isPublished: boolean; scheduledAt: Date | null; [key: string]: unknown }) => ({
      ...post,
      status: getPostStatus(post),
    }));

    return NextResponse.json({ posts: postsWithStatus });
  } catch (error) {
    console.error("Failed to fetch blog posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog posts" },
      { status: 500 }
    );
  }
}

// POST: Create a new blog post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      titleEn,
      content,
      contentEn,
      excerpt,
      excerptEn,
      slug,
      coverImage,
      categoryId,
      isPublished,
      scheduledAt,
      authorId,
    } = body;

    if (!title || !content || !slug) {
      return NextResponse.json(
        { error: "Title, content, and slug are required" },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const existing = await db.blogPost.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "A post with this slug already exists" },
        { status: 409 }
      );
    }

    // Determine publish state
    const shouldPublish = isPublished && !scheduledAt;
    const publishedAt = shouldPublish ? new Date() : null;

    const post = await db.blogPost.create({
      data: {
        title,
        titleEn: titleEn || null,
        content,
        contentEn: contentEn || null,
        excerpt: excerpt || null,
        excerptEn: excerptEn || null,
        slug,
        coverImage: coverImage || null,
        categoryId: categoryId || null,
        authorId,
        isPublished: shouldPublish,
        publishedAt,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      },
      include: {
        author: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
    });

    // Save initial revision
    await saveRevision(
      post.id,
      { title, titleEn, content, contentEn, excerpt, excerptEn, slug, coverImage, categoryId, isPublished: shouldPublish, scheduledAt },
      shouldPublish ? "Published" : "Created as draft",
      authorId
    );

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("Failed to create blog post:", error);
    return NextResponse.json(
      { error: "Failed to create blog post" },
      { status: 500 }
    );
  }
}

// PUT: Update an existing blog post
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      title,
      titleEn,
      content,
      contentEn,
      excerpt,
      excerptEn,
      slug,
      coverImage,
      categoryId,
      isPublished,
      scheduledAt,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    // Check slug uniqueness if changed
    if (slug) {
      const existing = await db.blogPost.findFirst({
        where: { slug, NOT: { id } },
      });
      if (existing) {
        return NextResponse.json(
          { error: "A post with this slug already exists" },
          { status: 409 }
        );
      }
    }

    // Determine publishedAt
    const currentPost = await db.blogPost.findUnique({ where: { id } });
    if (!currentPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    let publishedAt = currentPost.publishedAt;
    const shouldPublish = isPublished && !scheduledAt;

    if (shouldPublish && !currentPost.isPublished) {
      publishedAt = new Date();
    } else if (!shouldPublish) {
      publishedAt = null;
    }

    const post = await db.blogPost.update({
      where: { id },
      data: {
        title,
        titleEn: titleEn || null,
        content,
        contentEn: contentEn || null,
        excerpt: excerpt || null,
        excerptEn: excerptEn || null,
        slug,
        coverImage: coverImage || null,
        categoryId: categoryId || null,
        isPublished: shouldPublish,
        publishedAt,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      },
      include: {
        author: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
    });

    // Save revision
    let note = "Updated";
    if (shouldPublish && !currentPost.isPublished) {
      note = "Published";
    } else if (scheduledAt) {
      note = `Scheduled for ${new Date(scheduledAt).toLocaleString()}`;
    }

    await saveRevision(
      post.id,
      { title, titleEn, content, contentEn, excerpt, excerptEn, slug, coverImage, categoryId, isPublished: shouldPublish, scheduledAt },
      note
    );

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Failed to update blog post:", error);
    return NextResponse.json(
      { error: "Failed to update blog post" },
      { status: 500 }
    );
  }
}
