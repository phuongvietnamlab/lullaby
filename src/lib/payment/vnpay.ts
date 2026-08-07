import crypto from "crypto";
import { db } from "@/lib/db";

type CreateVnpayUrlParams = {
  amount: number;
  orderId: string;
  orderInfo: string;
  ipAddress: string;
  locale?: "vn" | "en";
};

type VnpayConfig = {
  tmnCode: string;
  hashSecret: string;
  url: string;
  returnUrl: string;
};

export class VnpayConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VnpayConfigError";
  }
}

/**
 * Merchant credentials, preferring the values an admin saved in `siteConfig`
 * and falling back to the environment.
 *
 * There is deliberately NO default for tmnCode / hashSecret: a placeholder
 * secret would let anyone forge a valid `vnp_SecureHash` on the return URL and
 * mark bookings as paid. Missing config is a hard error.
 */
async function getVnpayConfig(): Promise<VnpayConfig> {
  let dbTmnCode: string | undefined;
  let dbHashSecret: string | undefined;

  try {
    const configs = await db.siteConfig.findMany({
      where: { key: { in: ["vnpay_tmn_code", "vnpay_hash_secret"] } },
    });
    for (const c of configs) {
      const value = typeof c.value === "string" ? c.value : undefined;
      if (c.key === "vnpay_tmn_code") dbTmnCode = value || undefined;
      if (c.key === "vnpay_hash_secret") dbHashSecret = value || undefined;
    }
  } catch (error) {
    console.error("Failed to read VNPay config from DB, using env:", error);
  }

  const tmnCode = dbTmnCode || process.env.VNPAY_TMN_CODE;
  const hashSecret = dbHashSecret || process.env.VNPAY_HASH_SECRET;

  if (!tmnCode || !hashSecret) {
    throw new VnpayConfigError(
      "VNPay is not configured: set VNPAY_TMN_CODE and VNPAY_HASH_SECRET (or save them in admin payment settings)."
    );
  }

  return {
    tmnCode,
    hashSecret,
    url:
      process.env.VNPAY_URL ||
      "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    returnUrl:
      process.env.VNPAY_RETURN_URL ||
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/payment/vnpay-return`,
  };
}

/** Whether VNPay credentials are present, without throwing. */
export async function isVnpayConfigured(): Promise<boolean> {
  try {
    await getVnpayConfig();
    return true;
  } catch {
    return false;
  }
}

function formatDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

/** Build the signable query string: params sorted, empties dropped. */
function buildQueryString(params: Record<string, string>): string {
  const queryParts: string[] = [];
  for (const key of Object.keys(params).sort()) {
    const value = params[key];
    if (value !== "" && value !== undefined) {
      queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  }
  return queryParts.join("&");
}

export async function createVnpayUrl({
  amount,
  orderId,
  orderInfo,
  ipAddress,
  locale = "vn",
}: CreateVnpayUrlParams): Promise<string> {
  const config = await getVnpayConfig();
  const createDate = formatDate(new Date());

  const vnpParams: Record<string, string> = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: config.tmnCode,
    vnp_Amount: (amount * 100).toString(),
    vnp_CreateDate: createDate,
    vnp_CurrCode: "VND",
    vnp_IpAddr: ipAddress,
    vnp_Locale: locale,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: "other",
    vnp_ReturnUrl: config.returnUrl,
    vnp_TxnRef: orderId,
  };

  const queryString = buildQueryString(vnpParams);

  // Create HMAC SHA512 hash
  const hmac = crypto.createHmac("sha512", config.hashSecret);
  const signed = hmac.update(queryString).digest("hex");

  return `${config.url}?${queryString}&vnp_SecureHash=${signed}`;
}

export async function verifyVnpayReturn(query: Record<string, string>): Promise<{
  isValid: boolean;
  responseCode: string;
  txnRef: string;
  amount: number;
}> {
  const config = await getVnpayConfig();
  const secureHash = query["vnp_SecureHash"] || "";

  // Remove hash fields from verification
  const verifyParams = { ...query };
  delete verifyParams["vnp_SecureHash"];
  delete verifyParams["vnp_SecureHashType"];

  const queryString = buildQueryString(verifyParams);

  // Verify hash
  const hmac = crypto.createHmac("sha512", config.hashSecret);
  const signed = hmac.update(queryString).digest("hex");

  // Constant-time compare so the signature cannot be recovered byte by byte.
  const signedBuf = Buffer.from(signed, "utf8");
  const receivedBuf = Buffer.from(secureHash.toLowerCase(), "utf8");
  const isValid =
    signedBuf.length === receivedBuf.length &&
    crypto.timingSafeEqual(signedBuf, receivedBuf);

  return {
    isValid,
    responseCode: query["vnp_ResponseCode"] || "",
    txnRef: query["vnp_TxnRef"] || "",
    amount: parseInt(query["vnp_Amount"] || "0", 10) / 100,
  };
}
