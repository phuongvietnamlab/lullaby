"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Edit, Trash2, Copy, Check, X, RefreshCw } from "lucide-react";

type Promotion = {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  status: "active" | "scheduled" | "expired" | "inactive";
  roomTypeIds: string[];
  roomTypeNames: string[];
};

type RoomTypeOption = {
  id: string;
  name: string;
  nameEn: string;
  slug: string;
};

type FormState = {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  roomTypeIds: string[];
};

function formatDiscount(type: string, value: number): string {
  if (type === "PERCENTAGE") return `${value}%`;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function emptyForm(): FormState {
  return {
    id: "",
    name: "",
    nameEn: "",
    description: "",
    code: "",
    discountType: "PERCENTAGE",
    discountValue: "10",
    startDate: today(),
    endDate: today(),
    isActive: true,
    roomTypeIds: [],
  };
}

function toForm(promo: Promotion): FormState {
  return {
    id: promo.id,
    name: promo.name,
    nameEn: promo.nameEn,
    description: promo.description,
    code: promo.code,
    discountType: promo.discountType,
    discountValue: String(promo.discountValue),
    startDate: promo.startDate,
    endDate: promo.endDate,
    isActive: promo.isActive,
    roomTypeIds: promo.roomTypeIds,
  };
}

/**
 * Plain fetch with no setState, so the mount effect below has nothing to call
 * synchronously (react-hooks/set-state-in-effect) and can cancel cleanly.
 */
async function fetchPromotions(): Promise<{
  promotions: Promotion[];
  roomTypes: RoomTypeOption[];
}> {
  const res = await fetch("/api/admin/promotions");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to load promotions");
  }
  return res.json();
}

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomTypeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchPromotions()
      .then((data) => {
        if (cancelled) return;
        setPromotions(data.promotions);
        setRoomTypes(data.roomTypes);
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
      const data = await fetchPromotions();
      setPromotions(data.promotions);
      setRoomTypes(data.roomTypes);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(
    () => ({
      total: promotions.length,
      active: promotions.filter((p) => p.status === "active").length,
      scheduled: promotions.filter((p) => p.status === "scheduled").length,
      expired: promotions.filter((p) => p.status === "expired").length,
    }),
    [promotions]
  );

  async function handleCopy(promo: Promotion) {
    try {
      await navigator.clipboard.writeText(promo.code);
      setCopiedId(promo.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // Clipboard unavailable (insecure context) — nothing useful to show
    }
  }

  async function handleDelete(promo: Promotion) {
    if (
      !window.confirm(
        `Delete promotion "${promo.name}" (${promo.code})? Existing bookings keep the code they were booked with.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/promotions?id=${promo.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to delete promotion");
        return;
      }
      setPromotions((list) => list.filter((p) => p.id !== promo.id));
    } catch {
      setError("Network error. Please try again.");
    }
  }

  async function handleSave() {
    if (!editing) return;

    setSaving(true);
    setFormError("");

    const payload = {
      ...(editing.id ? { id: editing.id } : {}),
      name: editing.name,
      nameEn: editing.nameEn,
      description: editing.description,
      code: editing.code,
      discountType: editing.discountType,
      discountValue: Number(editing.discountValue),
      startDate: editing.startDate,
      endDate: editing.endDate,
      isActive: editing.isActive,
      roomTypeIds: editing.roomTypeIds,
    };

    try {
      const res = await fetch("/api/admin/promotions", {
        method: editing.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFormError(data.error || "Failed to save promotion");
        return;
      }

      setEditing(null);
      await load();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500">Loading promotions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
          <p className="text-sm text-gray-500 mt-1">
            Discount codes accepted at checkout
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load()}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
          <button
            onClick={() => {
              setFormError("");
              setEditing(emptyForm());
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-slate-800 text-white rounded-md hover:bg-slate-700"
          >
            <Plus size={15} />
            New promotion
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Active" value={stats.active} />
        <StatCard label="Scheduled" value={stats.scheduled} />
        <StatCard label="Expired" value={stats.expired} />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Code</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Discount</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Period</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Applies to</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {promotions.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-500">
                    No promotions yet.
                  </td>
                </tr>
              )}
              {promotions.map((promo) => (
                <tr key={promo.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">
                    {promo.name}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleCopy(promo)}
                      className="inline-flex items-center gap-1.5 font-mono text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
                      title="Copy code"
                    >
                      {promo.code}
                      {copiedId === promo.id ? (
                        <Check size={12} className="text-green-600" />
                      ) : (
                        <Copy size={12} className="text-gray-400" />
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    {formatDiscount(promo.discountType, promo.discountValue)}
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs">
                    {promo.startDate} → {promo.endDate}
                  </td>
                  <td className="py-3 px-4 text-gray-600 text-xs">
                    {promo.roomTypeNames.length
                      ? promo.roomTypeNames.join(", ")
                      : "All room types"}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={promo.status} />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setFormError("");
                          setEditing(toForm(promo));
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(promo)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <PromotionForm
          form={editing}
          roomTypes={roomTypes}
          saving={saving}
          error={formError}
          onChange={setEditing}
          onCancel={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    scheduled: "bg-blue-100 text-blue-800",
    expired: "bg-gray-100 text-gray-600",
    inactive: "bg-yellow-100 text-yellow-800",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
        styles[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}

function PromotionForm({
  form,
  roomTypes,
  saving,
  error,
  onChange,
  onCancel,
  onSave,
}: {
  form: FormState;
  roomTypes: RoomTypeOption[];
  saving: boolean;
  error: string;
  onChange: (form: FormState) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    onChange({ ...form, [key]: value });

  function toggleRoomType(id: string) {
    onChange({
      ...form,
      roomTypeIds: form.roomTypeIds.includes(id)
        ? form.roomTypeIds.filter((rt) => rt !== id)
        : [...form.roomTypeIds, id],
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg my-8">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            {form.id ? "Edit promotion" : "New promotion"}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              {error}
            </div>
          )}

          <Field label="Name (VI)">
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Name (EN)">
            <input
              value={form.nameEn}
              onChange={(e) => set("nameEn", e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Code">
            <input
              value={form.code}
              onChange={(e) => set("code", e.target.value.toUpperCase())}
              placeholder="EARLY2025"
              className={`${inputClass} font-mono uppercase`}
            />
            <p className="mt-1 text-xs text-gray-500">
              Guests type this at checkout. A–Z, 0–9 and hyphens only.
            </p>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Discount type">
              <select
                value={form.discountType}
                onChange={(e) =>
                  set("discountType", e.target.value as FormState["discountType"])
                }
                className={inputClass}
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED_AMOUNT">Fixed amount (VND)</option>
              </select>
            </Field>
            <Field label="Value">
              <input
                type="number"
                min={1}
                max={form.discountType === "PERCENTAGE" ? 100 : undefined}
                value={form.discountValue}
                onChange={(e) => set("discountValue", e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date">
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="End date">
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => set("endDate", e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Applies to">
            <div className="space-y-1.5 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
              {roomTypes.map((rt) => (
                <label key={rt.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.roomTypeIds.includes(rt.id)}
                    onChange={() => toggleRoomType(rt.id)}
                  />
                  {rt.name}
                </label>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Select none to apply the code to every room type.
            </p>
          </Field>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
            />
            Active — unchecked codes are rejected at checkout
          </label>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-gray-100">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-4 py-2 text-sm bg-slate-800 text-white rounded-md hover:bg-slate-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
