import { getTranslations } from "next-intl/server";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; code?: string; reason?: string }>;
};

export default async function PaymentStatusPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { status, code, reason } = await searchParams;
  const t = await getTranslations("payment");

  const isSuccess = status === "success";
  const isFailed = status === "failed";

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Status Icon */}
        <div className="flex justify-center">
          {isSuccess ? (
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          ) : isFailed ? (
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
          ) : (
            <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-yellow-600" />
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {isSuccess
              ? t("successTitle")
              : isFailed
              ? t("failedTitle")
              : t("unknownTitle")}
          </h1>
          <p className="text-gray-600 mt-2">
            {isSuccess
              ? t("successDescription")
              : isFailed
              ? t("failedDescription")
              : t("unknownDescription")}
          </p>
        </div>

        {/* Booking Code */}
        {code && (
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">{t("bookingCode")}</p>
            <p className="text-xl font-mono font-bold text-gray-900 tracking-wider">
              {code}
            </p>
          </div>
        )}

        {/* Error reason for failed */}
        {isFailed && reason && reason !== "error" && (
          <p className="text-sm text-gray-500">
            {t("errorCode")}: {reason}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-4">
          {code && (
            <Link
              href={`/${locale}/booking/status?code=${code}`}
              className="w-full py-3 px-6 border border-gray-300 rounded-lg font-medium
                         hover:bg-gray-50 transition-all text-center text-gray-700"
            >
              {t("checkBookingStatus")}
            </Link>
          )}
          <Link
            href={`/${locale}`}
            className="w-full py-3 px-6 bg-slate-800 text-white rounded-lg font-medium
                       hover:bg-slate-700 transition-all text-center"
          >
            {t("backToHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
