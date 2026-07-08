"use client";

import { useState, useEffect } from "react";
import { Save, CreditCard, Eye, EyeOff } from "lucide-react";

export default function AdminPaymentSettingsPage() {
  const [enabled, setEnabled] = useState(false);
  const [tmnCode, setTmnCode] = useState("");
  const [hashSecret, setHashSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/payment")
      .then((res) => res.json())
      .then((data) => {
        const settings = data.settings || {};
        setEnabled(settings.payment_online_enabled === true || settings.payment_online_enabled === "true");
        setTmnCode(typeof settings.vnpay_tmn_code === "string" ? settings.vnpay_tmn_code : "");
        setHashSecret(typeof settings.vnpay_hash_secret === "string" ? settings.vnpay_hash_secret : "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/admin/payment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_online_enabled: enabled,
          vnpay_tmn_code: tmnCode,
          vnpay_hash_secret: hashSecret,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // Handle error silently
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure online payment via VNPay
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      {/* Enable/Disable Toggle */}
      <section className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <CreditCard size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Online Payment</h2>
              <p className="text-sm text-gray-500">
                When enabled, guests can pay online after booking via VNPay
              </p>
            </div>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              enabled ? "bg-blue-600" : "bg-gray-200"
            }`}
            role="switch"
            aria-checked={enabled}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </section>

      {/* VNPay Credentials */}
      <section className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">VNPay Configuration</h2>
        <p className="text-sm text-gray-500 mb-4">
          Enter your VNPay merchant credentials. For testing, leave empty to use sandbox defaults.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              TMN Code (Merchant Code)
            </label>
            <input
              type="text"
              value={tmnCode}
              onChange={(e) => setTmnCode(e.target.value)}
              placeholder="DEMO1234"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hash Secret
            </label>
            <div className="relative">
              <input
                type={showSecret ? "text" : "password"}
                value={hashSecret}
                onChange={(e) => setHashSecret(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Info */}
      <section className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> If VNPay credentials are not configured here, the system will use
          environment variables (VNPAY_TMN_CODE, VNPAY_HASH_SECRET). For sandbox testing,
          default demo credentials are used automatically.
        </p>
      </section>
    </div>
  );
}
