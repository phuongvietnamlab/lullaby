"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type Status = "idle" | "sending" | "success" | "error";

const inputClass =
  "w-full px-4 py-3 border border-[var(--color-border)] rounded-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors bg-transparent min-h-[48px]";

export function ContactForm() {
  const t = useTranslations("contact");
  const [status, setStatus] = useState<Status>("idle");
  const [errorKey, setErrorKey] = useState<string>("sendFailed");
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const update =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorKey(typeof data.error === "string" ? data.error : "sendFailed");
        setStatus("error");
        return;
      }

      setForm({ name: "", email: "", subject: "", message: "" });
      setStatus("success");
    } catch {
      setErrorKey("networkError");
      setStatus("error");
    }
  }

  const errorMessages: Record<string, string> = {
    invalidInput: t("errors.invalidInput"),
    rateLimited: t("errors.rateLimited"),
    networkError: t("errors.networkError"),
    sendFailed: t("errors.sendFailed"),
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm text-[var(--color-text-light)] mb-2"
          >
            {t("yourName")}
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            minLength={2}
            value={form.name}
            onChange={update("name")}
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm text-[var(--color-text-light)] mb-2"
          >
            {t("yourEmail")}
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            value={form.email}
            onChange={update("email")}
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label
          htmlFor="subject"
          className="block text-sm text-[var(--color-text-light)] mb-2"
        >
          {t("subject")}
        </label>
        <input
          type="text"
          id="subject"
          name="subject"
          required
          minLength={2}
          value={form.subject}
          onChange={update("subject")}
          className={inputClass}
        />
      </div>
      <div>
        <label
          htmlFor="message"
          className="block text-sm text-[var(--color-text-light)] mb-2"
        >
          {t("message")}
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          required
          minLength={10}
          value={form.message}
          onChange={update("message")}
          className="w-full px-4 py-3 border border-[var(--color-border)] rounded-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors bg-transparent resize-none"
        />
      </div>

      {status === "success" && (
        <p
          role="status"
          className="p-4 text-sm rounded-sm bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 text-[var(--color-success)]"
        >
          {t("sendSuccess")}
        </p>
      )}
      {status === "error" && (
        <p
          role="alert"
          className="p-4 text-sm rounded-sm bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 text-[var(--color-error)]"
        >
          {errorMessages[errorKey] ?? errorMessages.sendFailed}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full sm:w-auto px-8 py-4 bg-[var(--color-accent)] text-[var(--color-primary-dark)] text-xs uppercase tracking-widest font-medium hover:bg-[var(--color-accent-light)] transition-all duration-[var(--duration-normal)] ease-[var(--ease-luxury)] min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "sending" ? t("sending") : t("sendMessage")}
      </button>
    </form>
  );
}
