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

export function buildBookingConfirmationHtml(booking: BookingEmailData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const checkStatusUrl = `${appUrl}/booking/status?code=${booking.bookingCode}`;

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Xác nhận đặt phòng - Lullaby Sky Villa</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color:#1a1f3d;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#d4a853;font-size:24px;font-weight:700;letter-spacing:1px;">
                LULLABY SKY VILLA
              </h1>
              <p style="margin:8px 0 0;color:#a0a5c0;font-size:13px;letter-spacing:0.5px;">
                Hạ Long &bull; Quảng Ninh &bull; Việt Nam
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 8px;color:#1a1f3d;font-size:20px;font-weight:600;">
                Xin chào ${booking.guestName},
              </h2>
              <p style="margin:0 0 24px;color:#4a4a6a;font-size:15px;line-height:1.6;">
                Đặt phòng của bạn đã được tiếp nhận! Dưới đây là thông tin chi tiết:
              </p>

              <!-- Booking Details Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f8fc;border-radius:8px;border:1px solid #e8e8f0;margin-bottom:24px;">
                <tr>
                  <td style="padding:24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;color:#6b6b8a;font-size:13px;width:140px;">Mã đặt phòng:</td>
                        <td style="padding:6px 0;color:#1a1f3d;font-size:14px;font-weight:600;">${booking.bookingCode}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b6b8a;font-size:13px;">Phòng:</td>
                        <td style="padding:6px 0;color:#1a1f3d;font-size:14px;font-weight:500;">${booking.roomTypeName}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b6b8a;font-size:13px;">Nhận phòng:</td>
                        <td style="padding:6px 0;color:#1a1f3d;font-size:14px;font-weight:500;">${formatDate(booking.checkIn)}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b6b8a;font-size:13px;">Trả phòng:</td>
                        <td style="padding:6px 0;color:#1a1f3d;font-size:14px;font-weight:500;">${formatDate(booking.checkOut)}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b6b8a;font-size:13px;">Số đêm:</td>
                        <td style="padding:6px 0;color:#1a1f3d;font-size:14px;font-weight:500;">${booking.nights} đêm</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b6b8a;font-size:13px;">Số khách:</td>
                        <td style="padding:6px 0;color:#1a1f3d;font-size:14px;font-weight:500;">${booking.guestCount}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding:12px 0 0;border-top:1px solid #e8e8f0;"></td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b6b8a;font-size:13px;font-weight:600;">Tổng tiền:</td>
                        <td style="padding:6px 0;color:#d4a853;font-size:16px;font-weight:700;">${formatPrice(booking.totalPrice)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Status -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;background-color:#fff8e6;border-radius:8px;border-left:4px solid #d4a853;">
                    <p style="margin:0 0 4px;color:#1a1f3d;font-size:14px;font-weight:600;">
                      Trạng thái: Đang chờ xác nhận
                    </p>
                    <p style="margin:0;color:#6b6b8a;font-size:13px;">
                      Đặt phòng sẽ hết hạn sau 48 giờ nếu chưa được xác nhận thanh toán.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 16px;">
                    <a href="${checkStatusUrl}" style="display:inline-block;padding:14px 32px;background-color:#1a1f3d;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;letter-spacing:0.3px;">
                      Kiểm tra trạng thái đặt phòng
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:16px 0 0;color:#8a8aa0;font-size:12px;text-align:center;line-height:1.5;">
                Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ chúng tôi qua email hoặc điện thoại bên dưới.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f8fc;padding:24px 40px;border-top:1px solid #e8e8f0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:center;">
                    <p style="margin:0 0 4px;color:#1a1f3d;font-size:14px;font-weight:600;">
                      Lullaby Sky Villa Ha Long
                    </p>
                    <p style="margin:0 0 4px;color:#6b6b8a;font-size:12px;">
                      Bãi Cháy, Hạ Long, Quảng Ninh, Việt Nam
                    </p>
                    <p style="margin:0 0 4px;color:#6b6b8a;font-size:12px;">
                      ĐT: +84-203-382-8888
                    </p>
                    <p style="margin:0;color:#6b6b8a;font-size:12px;">
                      Email: info@lullabyskyvillahahalong.com
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
