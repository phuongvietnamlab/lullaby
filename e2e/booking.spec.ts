import { test, expect, APIRequestContext } from "@playwright/test";

/**
 * NOTE: the API rate limiter is in-memory and per server process (5 booking
 * POSTs per IP per hour). Running this file repeatedly against the same
 * long-lived server will exhaust it, so assertions that spend a booking POST
 * accept 429 as a valid "guard is working" outcome. Restart the server for a
 * clean run.
 */

/** A stay a few weeks out, so it is always in the future. */
function futureStay(offsetDays = 30, nights = 2) {
  const inDate = new Date();
  inDate.setDate(inDate.getDate() + offsetDays);
  const outDate = new Date(inDate);
  outDate.setDate(outDate.getDate() + nights);
  const iso = (d: Date) => d.toISOString().split("T")[0];
  return { checkIn: iso(inDate), checkOut: iso(outDate) };
}

async function firstAvailableRoom(request: APIRequestContext) {
  const { checkIn, checkOut } = futureStay();
  const res = await request.post("/api/bookings/check-availability", {
    data: { checkIn, checkOut, guestCount: 1 },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  return { checkIn, checkOut, rooms: body.rooms as Array<Record<string, unknown>> };
}

test.describe("booking validation", () => {
  test("availability search returns rooms", async ({ request }) => {
    const { rooms } = await firstAvailableRoom(request);
    expect(Array.isArray(rooms)).toBe(true);
    expect(rooms.length).toBeGreaterThan(0);
  });

  test("guestCount above the room's maxGuests is rejected", async ({ request }) => {
    const { checkIn, checkOut, rooms } = await firstAvailableRoom(request);
    const room = rooms[0];
    const overCapacity = Number(room.maxGuests) + 1;

    const res = await request.post("/api/bookings", {
      data: {
        roomTypeId: room.roomSlug,
        checkIn,
        checkOut,
        guestCount: overCapacity,
        guestName: "E2E Overcapacity",
        guestEmail: `e2e-cap-${Date.now()}@example.com`,
        guestPhone: "0900000000",
      },
    });

    // 400 = our occupancy guard, 429 = rate limiter got there first.
    // Anything 2xx means an over-capacity booking was accepted.
    expect([400, 429]).toContain(res.status());
  });

  test("past check-in dates are rejected", async ({ request }) => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    const iso = past.toISOString().split("T")[0];

    const res = await request.post("/api/bookings/check-availability", {
      data: { checkIn: iso, checkOut: iso, guestCount: 1 },
    });
    expect(res.status()).toBe(400);
  });

  test("unknown room type is a 404, not a 500", async ({ request }) => {
    const { checkIn, checkOut } = futureStay();
    const res = await request.post("/api/bookings", {
      data: {
        roomTypeId: "no-such-room-type",
        checkIn,
        checkOut,
        guestCount: 1,
        guestName: "E2E Missing",
        guestEmail: `e2e-missing-${Date.now()}@example.com`,
        guestPhone: "0900000000",
      },
    });
    expect([404, 429]).toContain(res.status());
  });
});

test.describe("API errors carry a machine-readable code", () => {
  test("date validation failures return a code, not just prose", async ({ request }) => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    const iso = past.toISOString().split("T")[0];

    const res = await request.post("/api/bookings/check-availability", {
      data: { checkIn: iso, checkOut: iso, guestCount: 1 },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(["checkInPast", "checkOutBeforeCheckIn"]).toContain(body.code);
  });

  test("over-capacity booking returns code + maxGuests", async ({ request }) => {
    const { checkIn, checkOut, rooms } = await firstAvailableRoom(request);
    const room = rooms[0];

    const res = await request.post("/api/bookings", {
      data: {
        roomTypeId: room.roomSlug,
        checkIn,
        checkOut,
        guestCount: Number(room.maxGuests) + 1,
        guestName: "E2E Code",
        guestEmail: `e2e-code-${Date.now()}@example.com`,
        guestPhone: "0900000000",
      },
    });
    expect([400, 429]).toContain(res.status());
    const body = await res.json();
    if (res.status() === 429) {
      expect(body.code).toBe("rateLimited");
      return;
    }
    expect(body.code).toBe("overCapacity");
    expect(body.maxGuests).toBe(Number(room.maxGuests));
  });
});

test.describe("guests never see raw English API errors", () => {
  test("an unknown code shows Vietnamese copy on the /vi status page", async ({ page }) => {
    await page.goto("/vi/booking/status?code=LULLABY-ZZZZZZ", {
      waitUntil: "domcontentloaded",
    });

    const body = page.locator("body");
    // Positive assertion first, so the negatives below cannot pass on an
    // empty page that simply rendered nothing.
    await expect(body).toContainText(/Không tìm thấy|quá nhiều/);
    await expect(body).not.toContainText("Booking not found");
    await expect(body).not.toContainText("Internal server error");
    await expect(body).not.toContainText("Too many requests");
  });
});

test.describe("booking lookup does not leak PII", () => {
  test("unknown code is 404 and never a raw email", async ({ request }) => {
    const res = await request.get("/api/bookings/LULLABY-ZZZZZZ");
    expect([404, 429]).toContain(res.status());
    const text = await res.text();
    expect(text).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
  });
});

test.describe("payment callback", () => {
  test("a forged VNPay return cannot confirm a booking", async ({ request }) => {
    const res = await request.get(
      "/api/payment/vnpay-return?vnp_ResponseCode=00&vnp_TxnRef=LULLABY-ABC123&vnp_Amount=100&vnp_SecureHash=deadbeef",
      { maxRedirects: 0 }
    );

    // Must redirect to the failure screen, never to status=success
    expect([302, 303, 307]).toContain(res.status());
    const location = res.headers()["location"] || "";
    expect(location).toContain("status=failed");
    expect(location).not.toContain("status=success");
  });
});

test.describe("promo codes", () => {
  test("an unknown code is reported invalid, not applied", async ({ request }) => {
    const { checkIn, checkOut, rooms } = await firstAvailableRoom(request);
    const res = await request.post("/api/promotions/validate", {
      data: {
        code: "TOTALLY-NOT-A-REAL-CODE",
        roomSlug: rooms[0].roomSlug,
        checkIn,
        checkOut,
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.valid).toBe(false);
  });
});
