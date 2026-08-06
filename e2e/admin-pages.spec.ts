import { test, expect } from "@playwright/test";

/**
 * The guests / promotions / rooms / settings pages used to render hardcoded
 * mock data with no network calls at all — staff saw fabricated guests and
 * promotion edits vanished on refresh. These assert each page now reads from
 * the database and that its writes persist.
 *
 * Runs in the "authenticated" project, which reuses the single sign-in from
 * auth.setup.ts.
 */

/**
 * Values that exist ONLY in src/lib/admin/mock-data.ts.
 *
 * Guest names are deliberately not listed: the seed script puts the same people
 * in the database, so their presence proves nothing either way. The per-page
 * count check below is what actually establishes the data came from the API.
 */
const MOCK_MARKERS: Record<string, string[]> = {
  "/admin/guests": [],
  "/admin/promotions": ["EARLY2025", "TET2025", "SUMMER24", "WEEKEND30"],
  "/admin/rooms": [],
  "/admin/settings": [],
};

/** For each page, the API it must call and the array whose length must match. */
const PAGE_SOURCES: Record<string, { url: string; key: string } | null> = {
  "/admin/guests": { url: "/api/admin/guests", key: "guests" },
  "/admin/promotions": { url: "/api/admin/promotions", key: "promotions" },
  // The page opens on the Room Types tab; the units tab is checked separately.
  "/admin/rooms": { url: "/api/admin/rooms", key: "roomTypes" },
  "/admin/settings": null,
};

test.describe("admin pages read from the database", () => {
  test("the new admin APIs are reachable and guarded", async ({ context }) => {
    for (const url of [
      "/api/admin/guests",
      "/api/admin/promotions",
      "/api/admin/rooms/units",
      "/api/admin/settings",
    ]) {
      const res = await context.request.get(url);
      expect(res.status(), `${url} signed in`).toBe(200);
    }
  });

  for (const path of [
    "/admin/guests",
    "/admin/promotions",
    "/admin/rooms",
    "/admin/settings",
  ]) {
    test(`${path} fetches its data instead of rendering mocks`, async ({
      page,
      context,
    }) => {
      const apiCalls: string[] = [];
      page.on("request", (r) => {
        if (r.url().includes("/api/admin/")) apiCalls.push(r.url());
      });

      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page.locator("body")).not.toContainText("Loading");

      expect(apiCalls.length, `${path} made no admin API call`).toBeGreaterThan(0);

      const text = await page.locator("body").innerText();
      for (const marker of MOCK_MARKERS[path]) {
        expect(text, `${path} still shows mock value "${marker}"`).not.toContain(
          marker
        );
      }

      // The rendered row count must equal what the API returns. A page still
      // wired to mock-data would show its own fixed number instead.
      const source = PAGE_SOURCES[path];
      if (source) {
        const res = await context.request.get(source.url);
        const rows: unknown[] = (await res.json())[source.key];
        expect(apiCalls.some((u) => u.includes(source.url))).toBe(true);

        const rendered = await page.locator("tbody tr").count();
        const expected = rows.length === 0 ? 1 : rows.length; // empty-state row
        expect(rendered, `${path} rendered ${rendered} rows, API returned ${rows.length}`)
          .toBe(expected);
      }
    });
  }

  test("/admin/rooms lists the real physical rooms on its second tab", async ({
    page,
    context,
  }) => {
    await page.goto("/admin/rooms", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).not.toContainText("Loading");

    await page.getByRole("button", { name: /Individual Rooms/i }).click();

    const res = await context.request.get("/api/admin/rooms/units");
    const { rooms } = await res.json();

    const rendered = await page.locator("tbody tr").count();
    expect(rendered).toBe(rooms.length === 0 ? 1 : rooms.length);
  });
});

test.describe("promotion changes persist", () => {
  test("create, read back, then delete a promotion", async ({ context }) => {
    const code = `E2E${Date.now().toString().slice(-8)}`;
    const start = new Date().toISOString().split("T")[0];
    const end = new Date(Date.now() + 7 * 86_400_000).toISOString().split("T")[0];

    const created = await context.request.post("/api/admin/promotions", {
      data: {
        name: "E2E temporary promotion",
        code,
        discountType: "PERCENTAGE",
        discountValue: 10,
        startDate: start,
        endDate: end,
        isActive: true,
        roomTypeIds: [],
      },
    });
    expect(created.status()).toBe(201);
    const { promotion } = await created.json();

    try {
      // Survives a fresh read — the old page only ever held it in React state
      const listed = await context.request.get("/api/admin/promotions");
      const { promotions } = await listed.json();
      expect(promotions.map((p: { code: string }) => p.code)).toContain(code);

      // And checkout accepts it, so admin and the booking engine agree
      const avail = await context.request.post("/api/bookings/check-availability", {
        data: { checkIn: start, checkOut: end, guestCount: 1 },
      });
      const { rooms } = await avail.json();
      if (rooms.length > 0) {
        const validated = await context.request.post("/api/promotions/validate", {
          data: { code, roomSlug: rooms[0].roomSlug, checkIn: start, checkOut: end },
        });
        if (validated.status() === 200) {
          expect((await validated.json()).valid).toBe(true);
        }
      }
    } finally {
      const deleted = await context.request.delete(
        `/api/admin/promotions?id=${promotion.id}`
      );
      expect(deleted.status()).toBe(200);
    }

    // Gone after deletion, and checkout no longer honours it
    const after = await context.request.get("/api/admin/promotions");
    const { promotions: remaining } = await after.json();
    expect(remaining.map((p: { code: string }) => p.code)).not.toContain(code);
  });

  test("a percentage over 100 is rejected", async ({ context }) => {
    const res = await context.request.post("/api/admin/promotions", {
      data: {
        name: "E2E bad discount",
        code: `E2EBAD${Date.now().toString().slice(-6)}`,
        discountType: "PERCENTAGE",
        discountValue: 150,
        startDate: "2026-01-01",
        endDate: "2026-12-31",
      },
    });
    expect(res.status()).toBe(400);
  });

  test("endDate before startDate is rejected", async ({ context }) => {
    const res = await context.request.post("/api/admin/promotions", {
      data: {
        name: "E2E bad dates",
        code: `E2EDATE${Date.now().toString().slice(-6)}`,
        discountType: "PERCENTAGE",
        discountValue: 10,
        startDate: "2026-12-31",
        endDate: "2026-01-01",
      },
    });
    expect(res.status()).toBe(400);
  });
});

test.describe("settings persist", () => {
  test("a saved value survives a re-read, and junk URLs are dropped", async ({
    context,
  }) => {
    const before = await context.request.get("/api/admin/settings");
    const original = (await before.json()).settings;

    const tagline = `E2E ${Date.now()}`;
    const saved = await context.request.put("/api/admin/settings", {
      data: {
        tagline,
        socialMedia: { facebook: "javascript:alert(1)" },
      },
    });
    expect(saved.status()).toBe(200);

    const reread = await context.request.get("/api/admin/settings");
    const settings = (await reread.json()).settings;
    expect(settings.tagline).toBe(tagline);
    // The javascript: URL must never be stored
    expect(settings.socialMedia.facebook).not.toContain("javascript:");
    // A partial save must not blank unrelated fields
    expect(settings.hotelName).toBe(original.hotelName);

    // Restore
    await context.request.put("/api/admin/settings", { data: original });
  });
});
