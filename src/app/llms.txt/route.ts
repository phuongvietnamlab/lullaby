/**
 * /llms.txt — AI-readable guest ratings summary (D-10, SEO-03).
 *
 * Dynamic Route Handler that mirrors the robots.ts root-endpoint pattern and
 * returns a compact, PII-free markdown summary as text/plain. All figures come
 * from the shared reviews.ts aggregate helpers the pages and JSON-LD use, so the
 * AI-facing numbers stay consistent with the live site (SEO-04).
 *
 * Emits ONLY aggregates + room-type names — no guest names, no review bodies
 * (D-09 PII limit, T-11-09). The helpers try/catch internally, so a DB failure
 * degrades to the "No approved guest reviews yet." branch (T-11-10, Security V7).
 */

import { getAverageRating, getAllRoomTypeSummaries } from "@/lib/data/reviews";

// Cache the response for 5 min (match the pages' ISR window — Pitfall 4).
// "live" means eventually-consistent within revalidate; ISR absorbs crawler
// traffic so per-request DB load stays bounded (T-11-11).
export const revalidate = 300;

export async function GET() {
  const site = await getAverageRating();
  const rooms = await getAllRoomTypeSummaries();

  const lines: string[] = [];

  lines.push("# Lullaby Sky Villa");
  lines.push("");
  lines.push(
    "> Luxury hotel in Ha Long Bay. Guest reviews below are verified from real bookings."
  );
  lines.push("");
  lines.push("## Guest Ratings");
  lines.push("");

  if (site.count > 0) {
    lines.push(`- Overall: ${site.average}/5 from ${site.count} approved reviews`);
  } else {
    lines.push("- No approved guest reviews yet.");
  }

  if (rooms.length > 0) {
    lines.push("");
    lines.push("## Ratings by Room Type");
    lines.push("");
    for (const r of rooms) {
      lines.push(`- ${r.name}: ${r.average}/5 (${r.count} reviews)`);
    }
  }

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
