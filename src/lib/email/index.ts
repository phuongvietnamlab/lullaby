import { Resend } from "resend";
import { buildBookingConfirmationHtml } from "./templates/booking-confirmation";
import { buildAdminNotificationHtml } from "./templates/admin-notification";

// Initialize Resend client (lazy - only when API key is available)
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === "your-resend-api-key") {
    return null;
  }
  return new Resend(apiKey);
}

const FROM_EMAIL =
  process.env.FROM_EMAIL || "bookings@lullabyskyvillahahalong.com";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@lullabyskyvillahahalong.com";

export interface BookingEmailData {
  bookingCode: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomTypeName: string;
  checkIn: string; // ISO date string
  checkOut: string;
  guestCount: number;
  totalPrice: number;
  nights: number;
  status: string;
  expiresAt?: string;
  promoCode?: string;
  discountAmount?: number;
}

export interface ContactMessageData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Escape every guest-controlled string before it reaches an HTML template.
 * Guest name, phone and free-text fields land in the hotel's own inbox, so
 * unescaped markup there is an injection into staff email.
 */
function sanitizeBooking(booking: BookingEmailData): BookingEmailData {
  return {
    ...booking,
    bookingCode: escapeHtml(booking.bookingCode),
    guestName: escapeHtml(booking.guestName),
    guestEmail: escapeHtml(booking.guestEmail),
    guestPhone: escapeHtml(booking.guestPhone),
    roomTypeName: escapeHtml(booking.roomTypeName),
    promoCode: booking.promoCode ? escapeHtml(booking.promoCode) : undefined,
  };
}

/**
 * Send booking confirmation email to guest
 */
export async function sendBookingConfirmation(
  booking: BookingEmailData
): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.warn(
      "[Email] RESEND_API_KEY not configured. Skipping booking confirmation email."
    );
    return false;
  }

  try {
    const html = buildBookingConfirmationHtml(sanitizeBooking(booking));
    await resend.emails.send({
      from: `Lullaby Sky Villa <${FROM_EMAIL}>`,
      to: booking.guestEmail,
      subject: `Xác nhận đặt phòng - ${booking.bookingCode}`,
      html,
    });
    console.log(
      `[Email] Booking confirmation sent to ${booking.guestEmail} for ${booking.bookingCode}`
    );
    return true;
  } catch (error) {
    console.error("[Email] Failed to send booking confirmation:", error);
    return false;
  }
}

/**
 * Send new booking notification to admin
 */
export async function sendAdminNotification(
  booking: BookingEmailData
): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.warn(
      "[Email] RESEND_API_KEY not configured. Skipping admin notification email."
    );
    return false;
  }

  try {
    const html = buildAdminNotificationHtml(sanitizeBooking(booking));
    await resend.emails.send({
      from: `Lullaby Sky Villa Booking <${FROM_EMAIL}>`,
      to: ADMIN_EMAIL,
      subject: `[Đặt phòng mới] ${booking.bookingCode} - ${booking.guestName}`,
      html,
    });
    console.log(
      `[Email] Admin notification sent for booking ${booking.bookingCode}`
    );
    return true;
  } catch (error) {
    console.error("[Email] Failed to send admin notification:", error);
    return false;
  }
}

/**
 * Forward a contact form submission to the hotel inbox.
 * Returns false when email is not configured so the caller can surface that.
 */
export async function sendContactMessage(
  data: ContactMessageData
): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.warn(
      "[Email] RESEND_API_KEY not configured. Skipping contact message."
    );
    return false;
  }

  try {
    const html = `
      <div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; color: #222;">
        <h2 style="margin: 0 0 16px;">Tin nhắn mới từ website</h2>
        <p><strong>Họ tên:</strong> ${escapeHtml(data.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
        <p><strong>Tiêu đề:</strong> ${escapeHtml(data.subject)}</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 16px 0;" />
        <p style="white-space: pre-wrap;">${escapeHtml(data.message)}</p>
      </div>
    `;

    await resend.emails.send({
      from: `Lullaby Sky Villa <${FROM_EMAIL}>`,
      to: ADMIN_EMAIL,
      replyTo: data.email,
      subject: `[Liên hệ] ${data.subject}`,
      html,
    });
    console.log(`[Email] Contact message forwarded from ${data.email}`);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send contact message:", error);
    return false;
  }
}
