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
    <section className="py-12 md:py-20 px-4 md:px-8">
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
    <div className="text-center mb-10 md:mb-14">
      <h1 className="text-3xl md:text-5xl font-heading text-primary mb-3">
        {t("title")}
      </h1>
      <div className="luxury-divider mx-auto mb-4" />
      <p className="text-text-light max-w-md mx-auto">{t("subtitle")}</p>
    </div>
  );
}
