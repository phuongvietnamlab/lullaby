const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadError";
  }
}

/**
 * Upload an image file to Supabase Storage via the /api/upload endpoint.
 * @param file - The File object to upload
 * @param category - Optional category folder (rooms, gallery, blog, etc.)
 * @returns The public URL of the uploaded image
 */
export async function uploadImage(
  file: File,
  category?: string
): Promise<string> {
  // Client-side validation
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new UploadError(
      "Invalid file type. Accepted: jpg, jpeg, png, webp, gif"
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new UploadError("File too large. Maximum size is 5MB");
  }

  const formData = new FormData();
  formData.append("file", file);
  if (category) {
    formData.append("category", category);
  }

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json();
    throw new UploadError(data.error || "Upload failed");
  }

  const data = await response.json();
  return data.url;
}
