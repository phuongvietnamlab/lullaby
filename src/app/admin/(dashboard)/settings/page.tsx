"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Save, CreditCard, RefreshCw } from "lucide-react";

type Settings = {
  hotelName: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  checkInTime: string;
  checkOutTime: string;
  currency: string;
  defaultLocale: string;
  socialMedia: { facebook: string; instagram: string; twitter: string };
  seo: { metaTitle: string; metaDescription: string; ogImage: string };
  bookingPolicy: {
    cancellationHours: number;
    depositPercentage: number;
    maxAdvanceBookingDays: number;
    childAgeLimit: number;
  };
};

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500";

/**
 * Plain fetch with no setState, so the mount effect below has nothing to call
 * synchronously (react-hooks/set-state-in-effect) and can cancel cleanly.
 */
async function fetchSettings(): Promise<{ settings: Settings }> {
  const res = await fetch("/api/admin/settings");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to load settings");
  }
  return res.json();
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchSettings()
      .then((data) => {
        if (!cancelled) setSettings(data.settings);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setSettings((await fetchSettings()).settings);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to save settings");
        return;
      }
      const data = await res.json();
      // Re-seed from the server so any value it normalised is reflected here
      setSettings(data.settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500">Loading settings...</div>
      </div>
    );
  }

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings({ ...settings, [key]: value });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Hotel details, policies and SEO defaults
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load()}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <RefreshCw size={15} />
            Reload
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-slate-800 text-white rounded-md hover:bg-slate-700 disabled:opacity-50"
          >
            <Save size={15} />
            {saving ? "Saving..." : saved ? "Saved" : "Save changes"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      <Section title="Hotel information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Hotel name">
            <input
              value={settings.hotelName}
              onChange={(e) => set("hotelName", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Tagline">
            <input
              value={settings.tagline}
              onChange={(e) => set("tagline", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Contact email">
            <input
              type="email"
              value={settings.email}
              onChange={(e) => set("email", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Phone">
            <input
              value={settings.phone}
              onChange={(e) => set("phone", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <input
              value={settings.address}
              onChange={(e) => set("address", e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      <Section title="Stay defaults">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Field label="Check-in time">
            <input
              type="time"
              value={settings.checkInTime}
              onChange={(e) => set("checkInTime", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Check-out time">
            <input
              type="time"
              value={settings.checkOutTime}
              onChange={(e) => set("checkOutTime", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Currency">
            <input
              value={settings.currency}
              onChange={(e) => set("currency", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Default language">
            <select
              value={settings.defaultLocale}
              onChange={(e) => set("defaultLocale", e.target.value)}
              className={inputClass}
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </Field>
        </div>
      </Section>

      <Section title="Booking policy">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Field label="Free cancellation (hours)">
            <input
              type="number"
              min={0}
              max={720}
              value={settings.bookingPolicy.cancellationHours}
              onChange={(e) =>
                set("bookingPolicy", {
                  ...settings.bookingPolicy,
                  cancellationHours: Number(e.target.value),
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Deposit (%)">
            <input
              type="number"
              min={0}
              max={100}
              value={settings.bookingPolicy.depositPercentage}
              onChange={(e) =>
                set("bookingPolicy", {
                  ...settings.bookingPolicy,
                  depositPercentage: Number(e.target.value),
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Max advance (days)">
            <input
              type="number"
              min={1}
              max={1095}
              value={settings.bookingPolicy.maxAdvanceBookingDays}
              onChange={(e) =>
                set("bookingPolicy", {
                  ...settings.bookingPolicy,
                  maxAdvanceBookingDays: Number(e.target.value),
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Child age limit">
            <input
              type="number"
              min={0}
              max={18}
              value={settings.bookingPolicy.childAgeLimit}
              onChange={(e) =>
                set("bookingPolicy", {
                  ...settings.bookingPolicy,
                  childAgeLimit: Number(e.target.value),
                })
              }
              className={inputClass}
            />
          </Field>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          These values are stored for the public policy copy. The booking engine
          itself still enforces a fixed 48-hour payment hold and a 30-night
          maximum stay.
        </p>
      </Section>

      <Section title="Social media">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Facebook">
            <input
              value={settings.socialMedia.facebook}
              onChange={(e) =>
                set("socialMedia", {
                  ...settings.socialMedia,
                  facebook: e.target.value,
                })
              }
              placeholder="https://facebook.com/..."
              className={inputClass}
            />
          </Field>
          <Field label="Instagram">
            <input
              value={settings.socialMedia.instagram}
              onChange={(e) =>
                set("socialMedia", {
                  ...settings.socialMedia,
                  instagram: e.target.value,
                })
              }
              placeholder="https://instagram.com/..."
              className={inputClass}
            />
          </Field>
          <Field label="Twitter / X">
            <input
              value={settings.socialMedia.twitter}
              onChange={(e) =>
                set("socialMedia", {
                  ...settings.socialMedia,
                  twitter: e.target.value,
                })
              }
              placeholder="https://x.com/..."
              className={inputClass}
            />
          </Field>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Only http(s) links are stored. Anything else is discarded on save.
        </p>
      </Section>

      <Section title="SEO defaults">
        <div className="space-y-4">
          <Field label="Meta title">
            <input
              value={settings.seo.metaTitle}
              onChange={(e) =>
                set("seo", { ...settings.seo, metaTitle: e.target.value })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Meta description">
            <textarea
              rows={3}
              value={settings.seo.metaDescription}
              onChange={(e) =>
                set("seo", { ...settings.seo, metaDescription: e.target.value })
              }
              className={inputClass}
            />
          </Field>
          <Field label="OG image URL">
            <input
              value={settings.seo.ogImage}
              onChange={(e) =>
                set("seo", { ...settings.seo, ogImage: e.target.value })
              }
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard size={16} />
              Payment
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              VNPay credentials are managed separately so the secret is never
              displayed here.
            </p>
          </div>
          <Link
            href="/admin/settings/payment"
            className="shrink-0 px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Open
          </Link>
        </div>
      </section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <h2 className="font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
