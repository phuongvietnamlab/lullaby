import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { BookingStatusChecker } from "@/components/booking/booking-status-checker";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function BookingStatusPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <section className="py-12 md:py-20 px-4 md:px-8">
      <div className="max-w-2xl mx-auto">
        <Suspense fallback={<StatusPageSkeleton />}>
          <BookingStatusChecker />
        </Suspense>
      </div>
    </section>
  );
}

function StatusPageSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="text-center space-y-3">
        <div className="h-8 bg-surface-dim rounded w-64 mx-auto" />
        <div className="h-4 bg-surface-dim rounded w-48 mx-auto" />
      </div>
      <div className="flex gap-3">
        <div className="flex-1 h-12 bg-surface-dim rounded-lg" />
        <div className="w-24 h-12 bg-surface-dim rounded-lg" />
      </div>
    </div>
  );
}
