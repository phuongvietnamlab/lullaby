import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAdminSession } from "@/lib/auth-utils";
import { rateLimit } from "@/lib/rate-limit";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

/**
 * Folders an authenticated staff member may write to. `category` becomes part
 * of the storage path, so it is matched against this list rather than
 * interpolated — otherwise "../" escapes the intended prefix.
 */
const ADMIN_CATEGORIES = [
  "general",
  "rooms",
  "gallery",
  "blog",
  "content",
  "promotions",
  "reviews",
];

/** The only folder an unauthenticated guest may write to (review photos). */
const PUBLIC_CATEGORIES = ["reviews"];

function getExtension(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return map[mimeType] || "jpg";
}

/**
 * Confirm the bytes really are the image type the client claims. `file.type`
 * comes from the multipart headers and is trivially spoofed.
 */
function sniffImageType(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  // GIF: "GIF8"
  if (buffer.toString("ascii", 0, 4) === "GIF8") {
    return "image/gif";
  }
  // WebP: "RIFF"<size>"WEBP"
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    // Staff may upload to any category; guests only to the review-photo folder,
    // under a rate limit.
    const session = await requireAdminSession();

    if (!session) {
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown";
      const { allowed } = rateLimit(`upload:${ip}`, 10, 60 * 60 * 1000);
      if (!allowed) {
        return NextResponse.json(
          { error: "Too many uploads. Please try again later." },
          { status: 429 }
        );
      }
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const requested = (formData.get("category") as string) || "general";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedCategories = session ? ADMIN_CATEGORIES : PUBLIC_CATEGORIES;
    if (!allowedCategories.includes(requested)) {
      return NextResponse.json(
        { error: session ? "Invalid category" : "Unauthorized" },
        { status: session ? 400 : 401 }
      );
    }
    const category = requested;

    // Validate declared file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Accepted: jpg, jpeg, png, webp, gif" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB" },
        { status: 400 }
      );
    }

    // Convert File to ArrayBuffer then to Buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Guard against a size header that understates the real payload
    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB" },
        { status: 400 }
      );
    }

    // Trust the bytes, not the declared MIME type
    const sniffed = sniffImageType(buffer);
    if (!sniffed) {
      return NextResponse.json(
        { error: "Invalid file type. Accepted: jpg, jpeg, png, webp, gif" },
        { status: 400 }
      );
    }

    // Generate unique filename from the sniffed type
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = getExtension(sniffed);
    const filePath = `${category}/${timestamp}-${random}.${ext}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, buffer, {
        contentType: sniffed,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json(
        { error: "Upload failed: " + uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("images")
      .getPublicUrl(filePath);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
