import { test, expect, request as pwRequest } from "@playwright/test";

/**
 * Every admin API must reject an unauthenticated caller. Before the fix these
 * returned 200 with live data (guest PII, VNPay credentials, room pricing).
 */

const READ_ROUTES = [
  "/api/admin/bookings",
  "/api/admin/dashboard",
  "/api/admin/rooms",
  "/api/admin/blog",
  "/api/admin/blog/categories",
  "/api/admin/gallery",
  "/api/admin/payment",
  "/api/admin/content",
  "/api/admin/reviews",
  "/api/admin/revisions?entityType=blog_post&entityId=x",
  // Routes added when the mock admin pages were wired to the database
  "/api/admin/guests",
  "/api/admin/promotions",
  "/api/admin/rooms/units",
  "/api/admin/settings",
];

const WRITE_ROUTES: { method: "post" | "put" | "delete"; url: string; data?: unknown }[] = [
  { method: "put", url: "/api/admin/payment", data: { vnpay_hash_secret: "pwned" } },
  { method: "put", url: "/api/admin/rooms", data: { id: "x", basePrice: "1" } },
  { method: "post", url: "/api/admin/rooms", data: { name: "x", nameEn: "x", slug: "x", basePrice: "1" } },
  { method: "put", url: "/api/admin/content", data: { key: "homepage", value: { hacked: true } } },
  { method: "post", url: "/api/admin/blog", data: { title: "x", content: "x", slug: "x" } },
  { method: "put", url: "/api/admin/blog", data: { id: "x", title: "x" } },
  { method: "delete", url: "/api/admin/blog?id=x" },
  { method: "post", url: "/api/admin/gallery", data: { url: "http://x/x.jpg", category: "rooms" } },
  { method: "put", url: "/api/admin/gallery", data: { id: "x", alt: "x" } },
  { method: "delete", url: "/api/admin/gallery?id=x" },
  { method: "post", url: "/api/admin/revisions", data: { entityType: "blog_post", entityId: "x", data: {} } },
  { method: "post", url: "/api/admin/promotions", data: { name: "x", code: "X", discountType: "PERCENTAGE", discountValue: 10, startDate: "2026-01-01", endDate: "2026-12-31" } },
  { method: "put", url: "/api/admin/promotions", data: { id: "x", name: "x" } },
  { method: "delete", url: "/api/admin/promotions?id=x" },
  { method: "post", url: "/api/admin/rooms/units", data: { roomNumber: "999", roomTypeId: "x" } },
  { method: "put", url: "/api/admin/rooms/units", data: { id: "x", status: "OUT_OF_ORDER" } },
  { method: "delete", url: "/api/admin/rooms/units?id=x" },
  { method: "put", url: "/api/admin/settings", data: { hotelName: "pwned" } },
];

test.describe("admin API requires a staff session", () => {
  for (const url of READ_ROUTES) {
    test(`GET ${url} -> 401`, async ({ request }) => {
      const res = await request.get(url);
      expect(res.status()).toBe(401);
    });
  }

  for (const { method, url, data } of WRITE_ROUTES) {
    test(`${method.toUpperCase()} ${url} -> 401`, async ({ request }) => {
      const res = await request[method](url, data ? { data } : undefined);
      expect(res.status()).toBe(401);
    });
  }

  test("blog preview no longer leaks unpublished drafts", async ({ request }) => {
    const res = await request.get("/api/preview/blog/any-id");
    expect(res.status()).toBe(401);
  });
});

test.describe("public sign-up is disabled", () => {
  test("cannot self-register a new account", async () => {
    const ctx = await pwRequest.newContext({ baseURL: test.info().project.use.baseURL });
    const res = await ctx.post("/api/auth/sign-up/email", {
      data: {
        email: `attacker+${Date.now()}@example.com`,
        password: "Sup3rSecret!123",
        name: "Attacker",
      },
    });
    // better-auth answers 400/403 once sign-up is disabled; 200 would mean the
    // account was created and the admin panel is reachable.
    expect(res.status()).not.toBe(200);
    await ctx.dispose();
  });
});

test.describe("upload endpoint", () => {
  const pngBytes = Buffer.from(
    "89504e470d0a1a0a0000000d494844520000000100000001080600000" +
      "01f15c4890000000a49444154789c6360000002000100ffff03000006000557bfabd40000000049454e44ae426082",
    "hex"
  );

  test("anonymous upload is confined to the reviews folder", async ({ request }) => {
    const res = await request.post("/api/upload", {
      multipart: {
        file: { name: "a.png", mimeType: "image/png", buffer: pngBytes },
        category: "rooms",
      },
    });
    expect(res.status()).toBe(401);
  });

  test("path traversal in category is rejected", async ({ request }) => {
    const res = await request.post("/api/upload", {
      multipart: {
        file: { name: "a.png", mimeType: "image/png", buffer: pngBytes },
        category: "../../public",
      },
    });
    expect(res.status()).toBe(401);
  });

  test("a non-image body claiming image/png is rejected", async ({ request }) => {
    const res = await request.post("/api/upload", {
      multipart: {
        file: {
          name: "shell.png",
          mimeType: "image/png",
          buffer: Buffer.from("<?php system($_GET['c']); ?>", "utf8"),
        },
        category: "reviews",
      },
    });
    expect(res.status()).toBe(400);
  });
});
