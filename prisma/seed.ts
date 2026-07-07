import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: "postgresql://lullaby:lullaby123@localhost:5432/lullaby_hotel?schema=public",
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // ============================================
  // Admin Users
  // ============================================
  const admin = await prisma.user.upsert({
    where: { email: "admin@lullaby.com" },
    update: {},
    create: {
      name: "Nguyen Van Admin",
      email: "admin@lullaby.com",
      emailVerified: true,
      role: "SUPER_ADMIN",
      accounts: {
        create: {
          accountId: "admin-account-1",
          providerId: "credential",
          password: "$2a$10$GQH3rKX3gBVwJoGCBi0jHOdLrNKfRCOIIregZvBUZwJgkEQuXati6", // admin123
        },
      },
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@lullaby.com" },
    update: {},
    create: {
      name: "Tran Thi Manager",
      email: "manager@lullaby.com",
      emailVerified: true,
      role: "MANAGER",
      accounts: {
        create: {
          accountId: "manager-account-1",
          providerId: "credential",
          password: "$2a$10$GQH3rKX3gBVwJoGCBi0jHOdLrNKfRCOIIregZvBUZwJgkEQuXati6",
        },
      },
    },
  });

  console.log("  Users created:", admin.email, manager.email);

  // ============================================
  // Room Types
  // ============================================
  const roomTypes = await Promise.all([
    prisma.roomType.upsert({
      where: { slug: "superior-sea-view" },
      update: {},
      create: {
        name: "Phòng Superior Hướng Biển",
        nameEn: "Superior Sea View",
        slug: "superior-sea-view",
        description: "Phòng thoải mái với tầm nhìn biển tuyệt đẹp, tiện nghi hiện đại và thiết kế tối giản sang trọng.",
        descriptionEn: "Comfortable room with stunning sea view, modern amenities and minimalist luxury design.",
        basePrice: 2200000,
        maxGuests: 2,
        bedType: "King",
        size: 32,
        images: JSON.parse(JSON.stringify([
          "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
          "https://images.unsplash.com/photo-1590490360182-c33d9cf12a49?w=800&q=80",
        ])),
        amenities: JSON.parse(JSON.stringify(["WiFi", "AC", "Minibar", "Safe", "Smart TV", "Bathrobe", "Rain Shower"])),
        isActive: true,
        sortOrder: 1,
      },
    }),
    prisma.roomType.upsert({
      where: { slug: "deluxe-bay-view" },
      update: {},
      create: {
        name: "Phòng Deluxe Hướng Vịnh",
        nameEn: "Deluxe Bay View",
        slug: "deluxe-bay-view",
        description: "Phòng rộng rãi với tầm nhìn toàn cảnh Vịnh Hạ Long, nội thất cao cấp và ban công riêng.",
        descriptionEn: "Spacious room with panoramic Ha Long Bay view, premium furniture and private balcony.",
        basePrice: 3500000,
        maxGuests: 2,
        bedType: "King",
        size: 42,
        images: JSON.parse(JSON.stringify([
          "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80",
          "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
        ])),
        amenities: JSON.parse(JSON.stringify(["WiFi", "AC", "Minibar", "Safe", "Smart TV", "Bathrobe", "Rain Shower", "Coffee Machine", "Balcony", "Turndown Service"])),
        isActive: true,
        sortOrder: 2,
      },
    }),
    prisma.roomType.upsert({
      where: { slug: "premium-ocean-suite" },
      update: {},
      create: {
        name: "Suite Cao Cấp Hướng Biển",
        nameEn: "Premium Ocean Suite",
        slug: "premium-ocean-suite",
        description: "Suite sang trọng với phòng khách riêng biệt, tầm nhìn biển 180 độ và dịch vụ butler.",
        descriptionEn: "Luxurious suite with separate living area, 180-degree ocean view and butler service.",
        basePrice: 5500000,
        maxGuests: 3,
        bedType: "King",
        size: 58,
        images: JSON.parse(JSON.stringify([
          "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80",
          "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800&q=80",
        ])),
        amenities: JSON.parse(JSON.stringify(["WiFi", "AC", "Minibar", "Safe", "Smart TV", "Bathrobe", "Rain Shower", "Coffee Machine", "Balcony", "Turndown Service", "Lounge Access", "Breakfast Included"])),
        isActive: true,
        sortOrder: 3,
      },
    }),
    prisma.roomType.upsert({
      where: { slug: "executive-suite" },
      update: {},
      create: {
        name: "Suite Executive",
        nameEn: "Executive Suite",
        slug: "executive-suite",
        description: "Suite hạng sang với tầm nhìn toàn cảnh, phòng khách rộng rãi và đặc quyền Executive Lounge.",
        descriptionEn: "Premium suite with panoramic view, spacious living room and Executive Lounge privileges.",
        basePrice: 8000000,
        maxGuests: 4,
        bedType: "King",
        size: 75,
        images: JSON.parse(JSON.stringify([
          "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800&q=80",
          "https://images.unsplash.com/photo-1590490360182-c33d9cf12a49?w=800&q=80",
        ])),
        amenities: JSON.parse(JSON.stringify(["WiFi", "AC", "Minibar", "Safe", "Smart TV", "Bathrobe", "Rain Shower", "Coffee Machine", "Balcony", "Turndown Service", "Lounge Access", "Breakfast Included", "Spa Credit", "Airport Transfer"])),
        isActive: true,
        sortOrder: 4,
      },
    }),
    prisma.roomType.upsert({
      where: { slug: "presidential-suite" },
      update: {},
      create: {
        name: "Suite Tổng Thống",
        nameEn: "Presidential Suite",
        slug: "presidential-suite",
        description: "Trải nghiệm đỉnh cao xa hoa với bể bơi riêng, phòng bếp đầy đủ và dịch vụ butler 24/7.",
        descriptionEn: "The pinnacle of luxury with private pool, full kitchen and 24/7 butler service.",
        basePrice: 15000000,
        maxGuests: 4,
        bedType: "King",
        size: 120,
        images: JSON.parse(JSON.stringify([
          "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80",
          "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80",
        ])),
        amenities: JSON.parse(JSON.stringify(["WiFi", "AC", "Minibar", "Safe", "Smart TV", "Bathrobe", "Rain Shower", "Coffee Machine", "Balcony", "Turndown Service", "Lounge Access", "Breakfast Included", "Spa Credit", "Airport Transfer", "Private Pool", "Kitchen", "Jacuzzi", "Butler 24/7"])),
        isActive: true,
        sortOrder: 5,
      },
    }),
  ]);

  console.log("  Room types created:", roomTypes.length);

  // ============================================
  // Individual Rooms
  // ============================================
  const roomsData = [
    { roomNumber: "301", roomTypeSlug: "superior-sea-view", floor: 3 },
    { roomNumber: "302", roomTypeSlug: "superior-sea-view", floor: 3 },
    { roomNumber: "303", roomTypeSlug: "superior-sea-view", floor: 3 },
    { roomNumber: "304", roomTypeSlug: "superior-sea-view", floor: 3 },
    { roomNumber: "305", roomTypeSlug: "superior-sea-view", floor: 3 },
    { roomNumber: "501", roomTypeSlug: "deluxe-bay-view", floor: 5 },
    { roomNumber: "502", roomTypeSlug: "deluxe-bay-view", floor: 5 },
    { roomNumber: "503", roomTypeSlug: "deluxe-bay-view", floor: 5 },
    { roomNumber: "504", roomTypeSlug: "deluxe-bay-view", floor: 5 },
    { roomNumber: "801", roomTypeSlug: "premium-ocean-suite", floor: 8 },
    { roomNumber: "802", roomTypeSlug: "premium-ocean-suite", floor: 8 },
    { roomNumber: "803", roomTypeSlug: "premium-ocean-suite", floor: 8 },
    { roomNumber: "1201", roomTypeSlug: "executive-suite", floor: 12 },
    { roomNumber: "1202", roomTypeSlug: "executive-suite", floor: 12 },
    { roomNumber: "2001", roomTypeSlug: "presidential-suite", floor: 20 },
  ];

  for (const room of roomsData) {
    const rt = roomTypes.find((r) => r.slug === room.roomTypeSlug);
    if (!rt) continue;
    await prisma.room.upsert({
      where: { roomNumber: room.roomNumber },
      update: {},
      create: {
        roomNumber: room.roomNumber,
        roomTypeId: rt.id,
        floor: room.floor,
        status: "AVAILABLE",
      },
    });
  }
  console.log("  Rooms created:", roomsData.length);

  // ============================================
  // Guests
  // ============================================
  const guests = await Promise.all([
    prisma.guest.upsert({
      where: { email: "john.smith@email.com" },
      update: {},
      create: { name: "John Smith", email: "john.smith@email.com", phone: "+1-555-0101", nationality: "US" },
    }),
    prisma.guest.upsert({
      where: { email: "lan.nguyen@email.com" },
      update: {},
      create: { name: "Nguyen Thi Lan", email: "lan.nguyen@email.com", phone: "+84-905-123-456", nationality: "VN" },
    }),
    prisma.guest.upsert({
      where: { email: "yuki.tanaka@email.com" },
      update: {},
      create: { name: "Tanaka Yuki", email: "yuki.tanaka@email.com", phone: "+81-90-1234-5678", nationality: "JP" },
    }),
    prisma.guest.upsert({
      where: { email: "emma.wilson@email.com" },
      update: {},
      create: { name: "Emma Wilson", email: "emma.wilson@email.com", phone: "+44-7700-900123", nationality: "GB" },
    }),
    prisma.guest.upsert({
      where: { email: "phuong.pham@email.com" },
      update: {},
      create: { name: "Pham Vu Phuong", email: "phuong.pham@email.com", phone: "+84-912-345-678", nationality: "VN" },
    }),
  ]);
  console.log("  Guests created:", guests.length);

  // ============================================
  // Bookings
  // ============================================
  const superiorRT = roomTypes.find((r) => r.slug === "superior-sea-view")!;
  const deluxeRT = roomTypes.find((r) => r.slug === "deluxe-bay-view")!;
  const premiumRT = roomTypes.find((r) => r.slug === "premium-ocean-suite")!;

  await prisma.booking.createMany({
    data: [
      {
        bookingCode: "LULLABY-A1B2C3",
        guestId: guests[0].id,
        roomTypeId: deluxeRT.id,
        checkIn: new Date("2026-07-15"),
        checkOut: new Date("2026-07-18"),
        guestCount: 2,
        totalPrice: 10500000,
        status: "CONFIRMED",
        createdAt: new Date("2026-07-05"),
        specialRequests: "Late check-in, extra pillows",
      },
      {
        bookingCode: "LULLABY-D4E5F6",
        guestId: guests[1].id,
        roomTypeId: superiorRT.id,
        checkIn: new Date("2026-07-10"),
        checkOut: new Date("2026-07-12"),
        guestCount: 2,
        totalPrice: 4400000,
        status: "CHECK_IN",
        createdAt: new Date("2026-07-03"),
      },
      {
        bookingCode: "LULLABY-G7H8I9",
        guestId: guests[2].id,
        roomTypeId: premiumRT.id,
        checkIn: new Date("2026-07-20"),
        checkOut: new Date("2026-07-24"),
        guestCount: 2,
        totalPrice: 22000000,
        status: "PENDING",
        expiresAt: new Date("2026-07-10"),
        createdAt: new Date("2026-07-07"),
        specialRequests: "Anniversary celebration, champagne",
      },
      {
        bookingCode: "LULLABY-J1K2L3",
        guestId: guests[3].id,
        roomTypeId: superiorRT.id,
        checkIn: new Date("2026-07-08"),
        checkOut: new Date("2026-07-10"),
        guestCount: 1,
        totalPrice: 4400000,
        status: "COMPLETED",
        confirmedAt: new Date("2026-07-02"),
        createdAt: new Date("2026-07-01"),
      },
      {
        bookingCode: "LULLABY-M4N5O6",
        guestId: guests[4].id,
        roomTypeId: superiorRT.id,
        checkIn: new Date("2026-07-12"),
        checkOut: new Date("2026-07-14"),
        guestCount: 2,
        totalPrice: 4400000,
        status: "PENDING",
        expiresAt: new Date("2026-07-09"),
        createdAt: new Date("2026-07-07"),
      },
    ],
    skipDuplicates: true,
  });
  console.log("  Bookings created: 5");

  // ============================================
  // Reviews
  // ============================================
  await prisma.review.createMany({
    data: [
      {
        guestId: guests[0].id,
        roomTypeId: deluxeRT.id,
        rating: 5,
        comment: "The view from our Deluxe Bay View room was breathtaking. Staff was incredibly attentive!",
        response: "Thank you for your wonderful review, Mr. Smith! We're delighted you enjoyed.",
        status: "APPROVED",
      },
      {
        guestId: guests[2].id,
        roomTypeId: premiumRT.id,
        rating: 5,
        comment: "Beautiful hotel with excellent amenities. The spa was amazing. Will return!",
        status: "APPROVED",
      },
      {
        guestId: guests[3].id,
        roomTypeId: superiorRT.id,
        rating: 4,
        comment: "Great location and clean rooms. The Ha Long Bay view is unbeatable.",
        status: "PENDING",
      },
    ],
    skipDuplicates: true,
  });
  console.log("  Reviews created: 3");

  // ============================================
  // Blog Posts
  // ============================================
  await prisma.blogCategory.upsert({
    where: { slug: "travel-guide" },
    update: {},
    create: { name: "Du lịch", nameEn: "Travel Guide", slug: "travel-guide" },
  });
  await prisma.blogCategory.upsert({
    where: { slug: "news" },
    update: {},
    create: { name: "Tin tức", nameEn: "News", slug: "news" },
  });

  const travelCat = await prisma.blogCategory.findUnique({ where: { slug: "travel-guide" } });

  await prisma.blogPost.upsert({
    where: { slug: "top-10-ha-long-bay" },
    update: {},
    create: {
      title: "Top 10 Điều Nên Làm Tại Vịnh Hạ Long",
      titleEn: "Top 10 Things to Do in Ha Long Bay",
      slug: "top-10-ha-long-bay",
      content: "Khám phá những điểm đến và hoạt động không thể bỏ qua tại Vịnh Hạ Long...",
      contentEn: "Discover the must-see attractions and activities in Ha Long Bay...",
      excerpt: "Khám phá Vịnh Hạ Long",
      excerptEn: "Discover Ha Long Bay",
      coverImage: "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80",
      authorId: admin.id,
      categoryId: travelCat?.id,
      isPublished: true,
      publishedAt: new Date("2026-06-15"),
    },
  });
  console.log("  Blog posts created: 1");

  // ============================================
  // Promotions
  // ============================================
  await prisma.promotion.upsert({
    where: { code: "SUMMER2026" },
    update: {},
    create: {
      name: "Summer Special 2026",
      nameEn: "Summer Special 2026",
      description: "Giảm 20% cho tất cả phòng trong mùa hè",
      descriptionEn: "20% off all rooms this summer",
      discountType: "PERCENTAGE",
      discountValue: 20,
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-08-31"),
      isActive: true,
      code: "SUMMER2026",
    },
  });

  await prisma.promotion.upsert({
    where: { code: "HALONG30" },
    update: {},
    create: {
      name: "Ha Long Explorer",
      nameEn: "Ha Long Explorer",
      description: "Giảm 500.000đ khi đặt từ 3 đêm trở lên",
      descriptionEn: "500,000 VND off for 3+ night stays",
      discountType: "FIXED_AMOUNT",
      discountValue: 500000,
      startDate: new Date("2026-07-01"),
      endDate: new Date("2026-12-31"),
      isActive: true,
      code: "HALONG30",
    },
  });
  console.log("  Promotions created: 2");

  // ============================================
  // Site Config
  // ============================================
  const configs = [
    { key: "hotel_name", value: JSON.stringify("Lullaby Sky Villa & Spa"), category: "general" },
    { key: "hotel_phone", value: JSON.stringify("+84-203-123-4567"), category: "general" },
    { key: "hotel_email", value: JSON.stringify("info@lullaby.com"), category: "general" },
    { key: "hotel_address", value: JSON.stringify("Ha Long Bay, Quang Ninh, Vietnam"), category: "general" },
    { key: "check_in_time", value: JSON.stringify("14:00"), category: "operations" },
    { key: "check_out_time", value: JSON.stringify("12:00"), category: "operations" },
    { key: "payment_online_enabled", value: JSON.stringify(false), category: "payment" },
    { key: "currency", value: JSON.stringify("VND"), category: "general" },
  ];

  for (const config of configs) {
    await prisma.siteConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config,
    });
  }
  console.log("  Site configs created:", configs.length);

  // ============================================
  // Gallery Images
  // ============================================
  await prisma.galleryImage.createMany({
    data: [
      { url: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80", alt: "Phòng Superior", altEn: "Superior Room", category: "rooms", sortOrder: 1 },
      { url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80", alt: "Phòng Deluxe", altEn: "Deluxe Room", category: "rooms", sortOrder: 2 },
      { url: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80", alt: "Vịnh Hạ Long", altEn: "Ha Long Bay Sunrise", category: "views", sortOrder: 1 },
      { url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80", alt: "Hồ bơi", altEn: "Infinity Pool", category: "facilities", sortOrder: 1 },
      { url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80", alt: "Nhà hàng", altEn: "Restaurant", category: "dining", sortOrder: 1 },
      { url: "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80", alt: "Thuyền trên vịnh", altEn: "Bay Boats", category: "views", sortOrder: 2 },
    ],
    skipDuplicates: true,
  });
  console.log("  Gallery images created: 6");

  console.log("\n✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
