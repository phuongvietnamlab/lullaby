import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { BookingWizard } from "@/components/booking/booking-wizard";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function BookingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <section className="pt-24 sm:pt-28 pb-12 sm:pb-20 px-4 sm:px-6 md:px-8">
      <div className="max-w-5xl mx-auto">
        <BookingPageHeader />
        <BookingWizard />
      </div>
    </section>
  );
}

function BookingPageHeader() {
  const t = useTranslations("booking");
  return (
    <div className="text-center mb-8 sm:mb-10 md:mb-14">
      <h1 className="text-2xl sm:text-3xl md:text-5xl font-heading text-primary mb-3">
        {t("title")}
      </h1>
      <div className="luxury-divider mx-auto mb-4" />
      <p className="text-text-light max-w-md mx-auto text-sm sm:text-base">{t("subtitle")}</p>
    </div>
  );
}
