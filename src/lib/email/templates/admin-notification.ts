import { BookingEmailData } from "../index";

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatPrice(price: number): string {
  return price.toLocaleString("vi-VN") + " đ";
}

export function buildAdminNotificationHtml(booking: BookingEmailData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const adminBookingsUrl = `${appUrl}/admin/bookings`;

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Đặt phòng mới - ${booking.bookingCode}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color:#1a1f3d;padding:24px 40px;text-align:center;">
              <h1 style="margin:0;color:#d4a853;font-size:18px;font-weight:600;">
                🔔 Đặt phòng mới
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 20px;color:#1a1f3d;font-size:15px;line-height:1.6;">
                Có một đặt phòng mới cần xử lý:
              </p>

              <!-- Guest Info -->
              <h3 style="margin:0 0 12px;color:#1a1f3d;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">
                Thông tin khách
              </h3>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;background-color:#f8f8fc;border-radius:8px;border:1px solid #e8e8f0;">
                <tr>
                  <td style="padding:16px 20px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:4px 0;color:#6b6b8a;font-size:13px;width:120px;">Tên khách:</td>
                        <td style="padding:4px 0;color:#1a1f3d;font-size:14px;font-weight:500;">${booking.guestName}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:#6b6b8a;font-size:13px;">Email:</td>
                        <td style="padding:4px 0;color:#1a1f3d;font-size:14px;">${booking.guestEmail}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:#6b6b8a;font-size:13px;">Điện thoại:</td>
                        <td style="padding:4px 0;color:#1a1f3d;font-size:14px;">${booking.guestPhone}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Booking Info -->
              <h3 style="margin:0 0 12px;color:#1a1f3d;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">
                Chi tiết đặt phòng
              </h3>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;background-color:#f8f8fc;border-radius:8px;border:1px solid #e8e8f0;">
                <tr>
                  <td style="padding:16px 20px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:4px 0;color:#6b6b8a;font-size:13px;width:120px;">Mã đặt phòng:</td>
                        <td style="padding:4px 0;color:#d4a853;font-size:14px;font-weight:700;">${booking.bookingCode}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:#6b6b8a;font-size:13px;">Loại phòng:</td>
                        <td style="padding:4px 0;color:#1a1f3d;font-size:14px;font-weight:500;">${booking.roomTypeName}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:#6b6b8a;font-size:13px;">Nhận phòng:</td>
                        <td style="padding:4px 0;color:#1a1f3d;font-size:14px;">${formatDate(booking.checkIn)}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:#6b6b8a;font-size:13px;">Trả phòng:</td>
                        <td style="padding:4px 0;color:#1a1f3d;font-size:14px;">${formatDate(booking.checkOut)}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:#6b6b8a;font-size:13px;">Số đêm:</td>
                        <td style="padding:4px 0;color:#1a1f3d;font-size:14px;">${booking.nights} đêm</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:#6b6b8a;font-size:13px;">Số khách:</td>
                        <td style="padding:4px 0;color:#1a1f3d;font-size:14px;">${booking.guestCount}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding:8px 0 0;border-top:1px solid #e8e8f0;"></td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:#6b6b8a;font-size:13px;font-weight:600;">Tổng tiền:</td>
                        <td style="padding:4px 0;color:#d4a853;font-size:16px;font-weight:700;">${formatPrice(booking.totalPrice)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0;">
                    <a href="${adminBookingsUrl}" style="display:inline-block;padding:12px 28px;background-color:#1a1f3d;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
                      Xem trong Admin Panel
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f8fc;padding:16px 40px;border-top:1px solid #e8e8f0;text-align:center;">
              <p style="margin:0;color:#8a8aa0;font-size:11px;">
                Email tự động từ hệ thống đặt phòng Lullaby Sky Villa
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
