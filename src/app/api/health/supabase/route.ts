import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json({
      ok: true,
      service: "supabase",
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Supabase health check error:", error);

    return NextResponse.json(
      {
        ok: false,
        service: "supabase",
        checkedAt: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
