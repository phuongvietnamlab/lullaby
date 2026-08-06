/**
 * Translate an API error response for display.
 *
 * The booking routes return a stable `code` alongside a developer-facing
 * English `error` string. Rendering that raw string put English text in front
 * of Vietnamese guests, so the client resolves the code instead and only ever
 * falls back to a generic translated message.
 */

/** Codes the booking, availability and lookup routes can return. */
const KNOWN_CODES = [
  "checkInPast",
  "checkOutBeforeCheckIn",
  "maxStayExceeded",
  "rateLimited",
  "invalidInput",
  "roomNotFound",
  "soldOut",
  "overCapacity",
  "serverError",
  "notFound",
] as const;

export type BookingErrorCode = (typeof KNOWN_CODES)[number];

export type ApiErrorBody = {
  code?: unknown;
  error?: unknown;
  maxGuests?: unknown;
};

function isKnownCode(value: unknown): value is BookingErrorCode {
  return (
    typeof value === "string" && KNOWN_CODES.includes(value as BookingErrorCode)
  );
}

/**
 * @param translate - a next-intl `t` bound to the "booking.errors" namespace's
 *   parent, called as translate(key, values)
 * @param fallbackKey - key used when the response carries no recognised code
 */
export function translateApiError(
  body: ApiErrorBody | null | undefined,
  translate: (key: string, values?: Record<string, string | number>) => string,
  fallbackKey: string
): string {
  const code = body?.code;

  if (isKnownCode(code)) {
    const values =
      typeof body?.maxGuests === "number" ? { maxGuests: body.maxGuests } : undefined;
    return translate(`errors.${code}`, values);
  }

  return translate(fallbackKey);
}
