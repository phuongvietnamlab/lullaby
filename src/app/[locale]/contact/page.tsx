import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "vi" ? "Liên Hệ" : "Contact Us",
    description:
      locale === "vi"
        ? "Liên hệ Lullaby Sky Villa - Địa chỉ, điện thoại, email và bản đồ đến khách sạn tại Hạ Long"
        : "Contact Lullaby Sky Villa - Address, phone, email and directions to our hotel in Ha Long Bay",
  };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ContactContent />;
}

function ContactContent() {
  const t = useTranslations("contact");

  return (
    <>
      {/* Hero */}
      <section className="relative h-[40vh] sm:h-[50vh] min-h-[300px] sm:min-h-[350px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-primary-dark)] via-[var(--color-primary)] to-[var(--color-primary-light)]" />
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 text-center text-white px-4 sm:px-6">
          <h1 className="font-[family-name:var(--font-heading)] text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-medium mb-4">
            {t("title")}
          </h1>
          <p className="text-base sm:text-lg text-white/70 max-w-xl mx-auto">
            {t("subtitle")}
          </p>
          <div className="luxury-divider mx-auto mt-8" />
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-[var(--spacing-section-sm)] sm:py-[var(--spacing-section)] px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16">
            {/* Contact Form */}
            <ScrollReveal>
              <div>
                <h2 className="font-[family-name:var(--font-heading)] text-2xl sm:text-3xl mb-6 sm:mb-8">
                  {t("sendMessage")}
                </h2>
                <form className="space-y-5 sm:space-y-6" action="#" method="POST">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm text-[var(--color-text-light)] mb-2">
                        {t("yourName")}
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        className="w-full px-4 py-3 border border-[var(--color-border)] rounded-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors bg-transparent min-h-[48px]"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm text-[var(--color-text-light)] mb-2">
                        {t("yourEmail")}
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        className="w-full px-4 py-3 border border-[var(--color-border)] rounded-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors bg-transparent min-h-[48px]"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-sm text-[var(--color-text-light)] mb-2">
                      {t("subject")}
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      required
                      className="w-full px-4 py-3 border border-[var(--color-border)] rounded-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors bg-transparent min-h-[48px]"
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm text-[var(--color-text-light)] mb-2">
                      {t("message")}
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      required
                      className="w-full px-4 py-3 border border-[var(--color-border)] rounded-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors bg-transparent resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-4 bg-[var(--color-accent)] text-[var(--color-primary-dark)] text-xs uppercase tracking-widest font-medium hover:bg-[var(--color-accent-light)] transition-all duration-[var(--duration-normal)] ease-[var(--ease-luxury)] min-h-[48px]"
                  >
                    {t("sendMessage")}
                  </button>
                </form>
              </div>
            </ScrollReveal>

            {/* Contact Info + Map */}
            <ScrollReveal delay={0.2}>
              <div className="space-y-8 sm:space-y-10">
                {/* Info Cards */}
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-start gap-4 p-4 sm:p-6 border border-[var(--color-border)] rounded-sm">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center border border-[var(--color-accent)] rounded-full flex-shrink-0">
                      <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-[family-name:var(--font-heading)] text-lg mb-1">{t("address")}</h3>
                      <p className="text-[var(--color-text-light)] text-sm leading-relaxed">
                        Ha Long, Quang Ninh, Vietnam
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 sm:p-6 border border-[var(--color-border)] rounded-sm">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center border border-[var(--color-accent)] rounded-full flex-shrink-0">
                      <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-[family-name:var(--font-heading)] text-lg mb-1">{t("phone")}</h3>
                      <p className="text-[var(--color-text-light)] text-sm">+84 (0) 203 xxx xxxx</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 sm:p-6 border border-[var(--color-border)] rounded-sm">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center border border-[var(--color-accent)] rounded-full flex-shrink-0">
                      <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-[family-name:var(--font-heading)] text-lg mb-1">{t("email")}</h3>
                      <p className="text-[var(--color-text-light)] text-sm break-all sm:break-normal">info@lullabyskyvillahahalong.com</p>
                    </div>
                  </div>
                </div>

                {/* Google Maps Embed */}
                <div className="relative aspect-[4/3] sm:aspect-[4/3] rounded-sm overflow-hidden border border-[var(--color-border)]">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d59587.97785448!2d107.0235!3d20.9517!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x314a5796518cee87%3A0x55c6b0bcc85478b5!2sH%E1%BA%A1%20Long%2C%20Qu%E1%BA%A3ng%20Ninh%2C%20Vietnam!5e0!3m2!1svi!2s!4v1700000000000!5m2!1svi!2s"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Lullaby Sky Villa location on Google Maps"
                    className="absolute inset-0"
                  />
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </>
  );
}
