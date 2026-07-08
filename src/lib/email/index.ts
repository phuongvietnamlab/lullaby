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
    const html = buildBookingConfirmationHtml(booking);
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
    const html = buildAdminNotificationHtml(booking);
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
