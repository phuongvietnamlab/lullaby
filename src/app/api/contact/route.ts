import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { sendContactMessage } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email(),
  subject: z.string().trim().min(2).max(150),
  message: z.string().trim().min(10).max(2000),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 messages per IP per hour
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const { allowed } = rateLimit(`contact:${ip}`, 5, 60 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: "rateLimited" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalidInput", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const sent = await sendContactMessage(parsed.data);

    if (!sent) {
      return NextResponse.json({ error: "sendFailed" }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json({ error: "sendFailed" }, { status: 500 });
  }
}
