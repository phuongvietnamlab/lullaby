import crypto from "crypto";

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

function getVnpayConfig(): VnpayConfig {
  return {
    tmnCode: process.env.VNPAY_TMN_CODE || "DEMO1234",
    hashSecret: process.env.VNPAY_HASH_SECRET || "DEMO_HASH_SECRET_KEY_FOR_TESTING",
    url: process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    returnUrl: process.env.VNPAY_RETURN_URL || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/payment/vnpay-return`,
  };
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

export function createVnpayUrl({
  amount,
  orderId,
  orderInfo,
  ipAddress,
  locale = "vn",
}: CreateVnpayUrlParams): string {
  const config = getVnpayConfig();
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

  // Sort params alphabetically
  const sortedKeys = Object.keys(vnpParams).sort();
  const queryParts: string[] = [];

  for (const key of sortedKeys) {
    const value = vnpParams[key];
    if (value !== "" && value !== undefined) {
      queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  }

  const queryString = queryParts.join("&");

  // Create HMAC SHA512 hash
  const hmac = crypto.createHmac("sha512", config.hashSecret);
  const signed = hmac.update(queryString).digest("hex");

  return `${config.url}?${queryString}&vnp_SecureHash=${signed}`;
}

export function verifyVnpayReturn(query: Record<string, string>): {
  isValid: boolean;
  responseCode: string;
  txnRef: string;
  amount: number;
} {
  const config = getVnpayConfig();
  const secureHash = query["vnp_SecureHash"];

  // Remove hash fields from verification
  const verifyParams = { ...query };
  delete verifyParams["vnp_SecureHash"];
  delete verifyParams["vnp_SecureHashType"];

  // Sort and build query string
  const sortedKeys = Object.keys(verifyParams).sort();
  const queryParts: string[] = [];

  for (const key of sortedKeys) {
    const value = verifyParams[key];
    if (value !== "" && value !== undefined) {
      queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  }

  const queryString = queryParts.join("&");

  // Verify hash
  const hmac = crypto.createHmac("sha512", config.hashSecret);
  const signed = hmac.update(queryString).digest("hex");

  return {
    isValid: signed === secureHash,
    responseCode: query["vnp_ResponseCode"] || "",
    txnRef: query["vnp_TxnRef"] || "",
    amount: parseInt(query["vnp_Amount"] || "0") / 100,
  };
}
