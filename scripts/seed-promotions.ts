/**
 * Seeds the promotions table so promo codes can actually be applied at
 * checkout. The admin promotions page is still read-only mock data, and the
 * static promo list is dated 2024-2025, so without this every code validates
 * as expired.
 *
 * Run: npx tsx scripts/seed-promotions.ts
 */
import { db } from "../src/lib/db";

type Seed = {
  code: string;
  name: string;
  nameEn: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  startDate: string;
  endDate: string;
  /** Empty means the promo applies to every room type */
  roomSlugs: string[];
};

const PROMOTIONS: Seed[] = [
  {
    code: "WELCOME10",
    name: "Ưu đãi chào mừng",
    nameEn: "Welcome Offer",
    discountType: "PERCENTAGE",
    discountValue: 10,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    roomSlugs: [],
  },
  {
    code: "SUMMER20",
    name: "Ưu đãi mùa hè",
    nameEn: "Summer Offer",
    discountType: "PERCENTAGE",
    discountValue: 20,
    startDate: "2026-06-01",
    endDate: "2026-08-31",
    roomSlugs: ["superior-sea-view", "deluxe-bay-view"],
  },
  {
    code: "SUITE500K",
    name: "Giảm 500.000đ cho hạng Suite",
    nameEn: "500,000 VND off Suites",
    discountType: "FIXED_AMOUNT",
    discountValue: 500000,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    roomSlugs: ["premium-ocean-suite", "executive-suite", "presidential-suite"],
  },
];

async function main() {
  for (const seed of PROMOTIONS) {
    const promo = await db.promotion.upsert({
      where: { code: seed.code },
      update: {
        name: seed.name,
        nameEn: seed.nameEn,
        discountType: seed.discountType,
        discountValue: seed.discountValue,
        startDate: new Date(seed.startDate),
        endDate: new Date(seed.endDate),
        isActive: true,
      },
      create: {
        code: seed.code,
        name: seed.name,
        nameEn: seed.nameEn,
        discountType: seed.discountType,
        discountValue: seed.discountValue,
        startDate: new Date(seed.startDate),
        endDate: new Date(seed.endDate),
        isActive: true,
      },
    });

    // Rebuild the room-type links so re-running the script stays idempotent
    await db.promotionRoomType.deleteMany({ where: { promotionId: promo.id } });

    if (seed.roomSlugs.length > 0) {
      const roomTypes = await db.roomType.findMany({
        where: { slug: { in: seed.roomSlugs } },
        select: { id: true },
      });
      await db.promotionRoomType.createMany({
        data: roomTypes.map((rt) => ({ promotionId: promo.id, roomTypeId: rt.id })),
        skipDuplicates: true,
      });
      console.log(
        `  ${seed.code}: linked to ${roomTypes.length}/${seed.roomSlugs.length} room type(s)`
      );
    } else {
      console.log(`  ${seed.code}: applies to all room types`);
    }
  }

  console.log("\n✅ Promotions seeded.");
  await db.$disconnect();
}

main().catch(async (err) => {
  console.error("Error:", err);
  await db.$disconnect();
  process.exit(1);
});
