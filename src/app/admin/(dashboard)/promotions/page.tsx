"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, Copy, Check, X } from "lucide-react";
import { mockPromotions, type PromotionAdmin } from "@/lib/admin/mock-data";

function formatDiscount(type: string, value: number): string {
  if (type === "percentage") return `${value}%`;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

type FormState = Omit<PromotionAdmin, "applicableRooms"> & { applicableRooms: string };

function emptyForm(): FormState {
  return {
    id: "",
    name: "",
    code: "",
    discountType: "percentage",
    discountValue: 0,
    startDate: "",
    endDate: "",
    applicableRooms: "",
    status: "scheduled",
    usageCount: 0,
    maxUsage: 100,
  };
}

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<PromotionAdmin[]>(mockPromotions);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<FormState | null>(null);

  const activeCount = promotions.filter((p) => p.status === "active").length;
  const scheduledCount = promotions.filter((p) => p.status === "scheduled").length;
  const totalUsage = promotions.reduce((sum, p) => sum + p.usageCount, 0);

  async function handleCopy(promo: PromotionAdmin) {
    try {
      await navigator.clipboard.writeText(promo.code);
      setCopiedId(promo.id);
      setTimeout(() => setCopiedId((id) => (id === promo.id ? null : id)), 1500);
    } catch {
      // Clipboard unavailable (insecure context) — ignore silently.
    }
  }

  function handleDelete(promo: PromotionAdmin) {
    if (!window.confirm(`Delete promotion "${promo.name}"?`)) return;
    setPromotions((list) => list.filter((p) => p.id !== promo.id));
  }

  function openNew() {
    setEditing(emptyForm());
  }

  function openEdit(promo: PromotionAdmin) {
    setEditing({ ...promo, applicableRooms: promo.applicableRooms.join(", ") });
  }

  function handleSave(form: FormState) {
    const parsed: PromotionAdmin = {
      ...form,
      discountValue: Number(form.discountValue) || 0,
      maxUsage: Number(form.maxUsage) || 0,
      usageCount: Number(form.usageCount) || 0,
      applicableRooms: form.applicableRooms
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean),
    };

    setPromotions((list) => {
      if (form.id) {
        return list.map((p) => (p.id === form.id ? parsed : p));
      }
      return [...list, { ...parsed, id: `promo-${Date.now()}` }];
    });
    setEditing(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage discount codes and special offers
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-700 transition-colors"
        >
          <Plus size={16} />
          New Promotion
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Active Promotions</p>
          <p className="text-xl font-bold text-green-600 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Scheduled</p>
          <p className="text-xl font-bold text-blue-600 mt-1">{scheduledCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Usage This Month</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{totalUsage}</p>
        </div>
      </div>

      {/* Promotions Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Code</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Discount</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Period</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Rooms</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Usage</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {promotions.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 px-4 text-center text-gray-400">
                    No promotions yet. Click &quot;New Promotion&quot; to add one.
                  </td>
                </tr>
              )}
              {promotions.map((promo) => (
                <tr key={promo.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{promo.name}</td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                      {promo.code}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-green-700">
                    {formatDiscount(promo.discountType, promo.discountValue)} off
                  </td>
                  <td className="py-3 px-4 text-gray-600 text-xs">
                    {promo.startDate} → {promo.endDate}
                  </td>
                  <td className="py-3 px-4 text-gray-600 text-xs">
                    {promo.applicableRooms.join(", ")}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {promo.usageCount}/{promo.maxUsage}
                  </td>
                  <td className="py-3 px-4">
                    <PromoStatusBadge status={promo.status} />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleCopy(promo)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Copy code"
                      >
                        {copiedId === promo.id ? (
                          <Check size={15} className="text-green-600" />
                        ) : (
                          <Copy size={15} />
                        )}
                      </button>
                      <button
                        onClick={() => openEdit(promo)}
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
        <PromotionModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function PromotionModal({
  initial,
  onClose,
  onSave,
}: {
  initial: FormState;
  onClose: () => void;
  onSave: (form: FormState) => void;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const isEdit = Boolean(initial.id);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Edit Promotion" : "New Promotion"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 rounded"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="px-5 py-4 space-y-4">
          <Field label="Name">
            <input
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </Field>

          <Field label="Code">
            <input
              required
              value={form.code}
              onChange={(e) => set("code", e.target.value.toUpperCase())}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 font-mono"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Discount Type">
              <select
                value={form.discountType}
                onChange={(e) => set("discountType", e.target.value as PromotionAdmin["discountType"])}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed (VND)</option>
              </select>
            </Field>
            <Field label="Discount Value">
              <input
                type="number"
                min={0}
                required
                value={form.discountValue}
                onChange={(e) => set("discountValue", Number(e.target.value))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date">
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </Field>
            <Field label="End Date">
              <input
                type="date"
                required
                value={form.endDate}
                onChange={(e) => set("endDate", e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </Field>
          </div>

          <Field label="Applicable Rooms (comma-separated)">
            <input
              value={form.applicableRooms}
              onChange={(e) => set("applicableRooms", e.target.value)}
              placeholder="All Room Types"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value as PromotionAdmin["status"])}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              >
                <option value="scheduled">Scheduled</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
              </select>
            </Field>
            <Field label="Max Usage">
              <input
                type="number"
                min={0}
                required
                value={form.maxUsage}
                onChange={(e) => set("maxUsage", Number(e.target.value))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-slate-800 text-white rounded-md hover:bg-slate-700"
            >
              {isEdit ? "Save Changes" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
      {children}
    </label>
  );
}

function PromoStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    scheduled: "bg-blue-100 text-blue-800",
    expired: "bg-gray-100 text-gray-600",
  };

  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
}
