"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarRange,
  CircleDollarSign,
  Loader2,
  Pencil,
  Percent,
  Plus,
  RotateCcw,
  Tag,
  Ticket,
  Trash2,
  Truck,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import {
  removePromoCode,
  setAdminSettings,
  setAdminSettingsError,
  setAdminSettingsLoading,
  setStoreSettings,
  upsertPromoCode,
} from "@/store/slices/admin-settings.slice";
import type { AppDispatch, RootState } from "@/store";
import {
  buildPromoForm,
  buildSettingsForm,
  createPromoCode,
  deletePromoCode,
  DISCOUNT_TYPE_VALUES,
  EMPTY_PROMO_FORM,
  EMPTY_SETTINGS_FORM,
  fetchPromoCodes,
  fetchStoreSettings,
  formatCurrency,
  formatDate,
  fromDateTimeLocal,
  parseNumberField,
  parseOptionalInt,
  parseOptionalNumber,
  PROMO_STATUS_VALUES,
  updatePromoCode,
  updateStoreSettings,
  type PromoCodeRow,
  type PromoCodeStatus,
  type PromoDiscountType,
  type PromoFormState,
  type SettingsFormState,
} from "@/features/admin-settings/api";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<PromoCodeStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  INACTIVE: "bg-amber-50 text-amber-700 ring-amber-200",
};

const TYPE_BADGE: Record<PromoDiscountType, string> = {
  FLAT: "bg-violet-50 text-violet-700 ring-violet-200",
  PERCENT: "bg-sky-50 text-sky-700 ring-sky-200",
};

export default function AdminSettingsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const settings = useSelector((s: RootState) => s.adminSettings.settings);
  const promos = useSelector((s: RootState) => s.adminSettings.promos);
  const isHydrated = useSelector(
    (s: RootState) => s.adminSettings.isHydrated,
  );
  const isLoading = useSelector(
    (s: RootState) => s.adminSettings.isLoading,
  );
  const error = useSelector((s: RootState) => s.adminSettings.error);

  const [settingsForm, setSettingsForm] = useState<SettingsFormState>(
    EMPTY_SETTINGS_FORM,
  );
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsNote, setSettingsNote] = useState<string | null>(null);

  const [editing, setEditing] = useState<
    | { mode: "create" }
    | { mode: "edit"; promo: PromoCodeRow }
    | null
  >(null);
  const [promoForm, setPromoForm] = useState<PromoFormState>(EMPTY_PROMO_FORM);
  const [isSubmittingPromo, setIsSubmittingPromo] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoNote, setPromoNote] = useState<string | null>(null);
  const [busyPromoId, setBusyPromoId] = useState<string | null>(null);

  /* ---------------------------- Hydration ---------------------------- */

  const refresh = useCallback(async () => {
    dispatch(setAdminSettingsLoading(true));
    dispatch(setAdminSettingsError(null));
    try {
      const [storeSettings, promoCodes] = await Promise.all([
        fetchStoreSettings(),
        fetchPromoCodes(),
      ]);
      dispatch(setAdminSettings({ settings: storeSettings, promos: promoCodes }));
      setSettingsForm(buildSettingsForm(storeSettings));
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "Failed to load settings.";
      dispatch(setAdminSettingsError(message));
    } finally {
      dispatch(setAdminSettingsLoading(false));
    }
  }, [dispatch]);

  useEffect(() => {
    if (isHydrated) return;
    void refresh();
  }, [isHydrated, refresh]);

  // Keep the form synced with the store the first time settings arrive.
  useEffect(() => {
    if (!settings) return;
    setSettingsForm(buildSettingsForm(settings));
  }, [settings]);

  /* ---------------------------- Settings form ------------------------ */

  const handleSettingsSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setSettingsError(null);
    setSettingsNote(null);

    try {
      const taxPercent = parseNumberField(
        settingsForm.taxRatePercent || "0",
        "Tax rate",
      );
      if (taxPercent > 100) {
        throw new Error("Tax rate cannot exceed 100%.");
      }
      const standardShippingFee = parseNumberField(
        settingsForm.standardShippingFee || "0",
        "Standard delivery fee",
      );
      const expressShippingFee = parseNumberField(
        settingsForm.expressShippingFee || "0",
        "Express delivery fee",
      );
      const freeShippingThreshold = parseNumberField(
        settingsForm.freeShippingThreshold || "0",
        "Free shipping threshold",
      );
      const currency = settingsForm.currency.trim().toUpperCase() || "BDT";

      setIsSavingSettings(true);
      const updated = await updateStoreSettings({
        taxRate: taxPercent / 100,
        standardShippingFee,
        expressShippingFee,
        freeShippingThreshold,
        currency,
      });
      dispatch(setStoreSettings(updated));
      setSettingsForm(buildSettingsForm(updated));
      setSettingsNote("Store settings saved.");
    } catch (mutation) {
      const message =
        mutation instanceof Error ? mutation.message : "Failed to save settings.";
      setSettingsError(message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  /* ---------------------------- Promo CRUD --------------------------- */

  const openCreatePromo = () => {
    setEditing({ mode: "create" });
    setPromoForm(EMPTY_PROMO_FORM);
    setPromoError(null);
  };

  const openEditPromo = (promo: PromoCodeRow) => {
    setEditing({ mode: "edit", promo });
    setPromoForm(buildPromoForm(promo));
    setPromoError(null);
  };

  const closePromoPanel = () => {
    setEditing(null);
    setPromoError(null);
  };

  const handlePromoSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!editing) return;
    setPromoError(null);
    setPromoNote(null);

    try {
      const code = promoForm.code.trim();
      if (!code) throw new Error("Promo code is required.");

      const value = parseNumberField(promoForm.value || "0", "Discount value");
      if (promoForm.discountType === "PERCENT" && value > 100) {
        throw new Error("Percent discount must be between 0 and 100.");
      }

      const minOrder = parseOptionalNumber(
        promoForm.minOrder,
        "Minimum order",
      );
      const maxDiscount = parseOptionalNumber(
        promoForm.maxDiscount,
        "Maximum discount",
      );
      const usageLimit = parseOptionalInt(
        promoForm.usageLimit,
        "Usage limit",
      );

      const startsAt = fromDateTimeLocal(promoForm.startsAt);
      const endsAt = fromDateTimeLocal(promoForm.endsAt);
      if (startsAt && endsAt && new Date(startsAt) > new Date(endsAt)) {
        throw new Error("End date must be after the start date.");
      }

      const body = {
        code,
        description: promoForm.description.trim() || null,
        discountType: promoForm.discountType,
        value,
        minOrder,
        maxDiscount,
        startsAt,
        endsAt,
        usageLimit,
        status: promoForm.status,
      };

      setIsSubmittingPromo(true);
      const promo =
        editing.mode === "create"
          ? await createPromoCode(body)
          : await updatePromoCode(editing.promo.id, body);
      dispatch(upsertPromoCode(promo));
      setPromoNote(
        editing.mode === "create"
          ? `Promo code "${promo.code}" created.`
          : `Promo code "${promo.code}" updated.`,
      );
      closePromoPanel();
    } catch (mutation) {
      const message =
        mutation instanceof Error ? mutation.message : "Failed to save promo.";
      setPromoError(message);
    } finally {
      setIsSubmittingPromo(false);
    }
  };

  const handleDeletePromo = async (promo: PromoCodeRow) => {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        `Delete promo code "${promo.code}"? This cannot be undone.`,
      );
      if (!confirmed) return;
    }

    setPromoError(null);
    setPromoNote(null);
    setBusyPromoId(promo.id);

    try {
      await deletePromoCode(promo.id);
      dispatch(removePromoCode(promo.id));
      setPromoNote(`Promo code "${promo.code}" deleted.`);
    } catch (mutation) {
      const message =
        mutation instanceof Error ? mutation.message : "Failed to delete promo.";
      setPromoError(message);
    } finally {
      setBusyPromoId(null);
    }
  };

  const totals = useMemo(() => {
    let active = 0;
    let used = 0;
    for (const promo of promos) {
      if (promo.status === "ACTIVE") active += 1;
      used += promo.usedCount;
    }
    return { active, used };
  }, [promos]);

  return (
    <section className="space-y-6">
      {/* Page-level load error: visible no matter which card renders. */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm"
        >
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
            <RotateCcw className="h-4 w-4 text-red-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-red-800">
              Couldn&apos;t load settings
            </p>
            <p className="mt-0.5 break-words text-sm text-red-700">{error}</p>
            <p className="mt-1 text-xs text-red-600/80">
              The API responded with an error. If this persists right after a
              schema change, restart the dev server so the Prisma client picks
              up the new models.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              void refresh();
            }}
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl border border-red-300 bg-white px-3 text-xs font-semibold text-red-700 transition hover:bg-red-100"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Try again
          </button>
        </div>
      )}

      {/* Top row: store settings form */}
      <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
              <CircleDollarSign className="h-4 w-4 text-violet-600" />
              Store pricing
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Tax rate, delivery charges, and free shipping threshold. Applied
              to every cart on the next pricing pass.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              void refresh();
            }}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-violet-200 px-3 text-xs font-semibold text-violet-700 transition hover:bg-violet-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </header>

        {settingsError && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {settingsError}
          </div>
        )}
        {settingsNote && (
          <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {settingsNote}
          </div>
        )}

        {isLoading && !settings ? (
          <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-6 text-center text-sm text-violet-700">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading settings...
            </span>
          </div>
        ) : (
          <form onSubmit={handleSettingsSubmit} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <Field
                label="Tax rate (%)"
                hint="Customer's cart shows this percentage of subtotal."
                icon={<Percent className="h-3.5 w-3.5" />}
                required
              >
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={settingsForm.taxRatePercent}
                  onChange={(e) =>
                    setSettingsForm((prev) => ({
                      ...prev,
                      taxRatePercent: e.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
                  placeholder="5"
                />
              </Field>

              <Field
                label="Currency"
                hint="ISO-style code shown in the cart, e.g. BDT."
                required
              >
                <input
                  type="text"
                  value={settingsForm.currency}
                  onChange={(e) =>
                    setSettingsForm((prev) => ({
                      ...prev,
                      currency: e.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm uppercase outline-none transition focus:border-violet-500"
                  placeholder="BDT"
                />
              </Field>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <Field
                label="Standard delivery fee"
                icon={<Truck className="h-3.5 w-3.5" />}
                required
              >
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={settingsForm.standardShippingFee}
                  onChange={(e) =>
                    setSettingsForm((prev) => ({
                      ...prev,
                      standardShippingFee: e.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
                  placeholder="120"
                />
              </Field>

              <Field
                label="Express delivery fee"
                icon={<Truck className="h-3.5 w-3.5" />}
                required
              >
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={settingsForm.expressShippingFee}
                  onChange={(e) =>
                    setSettingsForm((prev) => ({
                      ...prev,
                      expressShippingFee: e.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
                  placeholder="250"
                />
              </Field>

              <Field
                label="Free shipping above"
                hint="Subtotal at which delivery is free."
                required
              >
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={settingsForm.freeShippingThreshold}
                  onChange={(e) =>
                    setSettingsForm((prev) => ({
                      ...prev,
                      freeShippingThreshold: e.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
                  placeholder="50000"
                />
              </Field>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={isSavingSettings || !settings}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 px-4 text-sm font-semibold text-white transition hover:from-violet-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingSettings && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Save settings
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Bottom: promo codes */}
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryCard
            icon={<Ticket className="h-4 w-4" />}
            label="Promo codes"
            value={promos.length.toLocaleString()}
            accent="violet"
          />
          <SummaryCard
            icon={<Tag className="h-4 w-4" />}
            label="Active codes"
            value={totals.active.toLocaleString()}
            accent="emerald"
          />
          <SummaryCard
            icon={<CalendarRange className="h-4 w-4" />}
            label="Total redemptions"
            value={totals.used.toLocaleString()}
            accent="amber"
          />
        </div>

        <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
                <Ticket className="h-4 w-4 text-violet-600" />
                Promo codes
              </h2>
              <p className="text-xs text-gray-500">
                Customers redeem these at the cart. Codes are case-insensitive.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreatePromo}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 px-4 text-sm font-semibold text-white transition hover:from-violet-700 hover:to-indigo-700"
            >
              <Plus className="h-4 w-4" />
              New promo code
            </button>
          </div>
        </div>

        {promoError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {promoError}
          </div>
        )}
        {promoNote && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {promoNote}
          </div>
        )}

        {promos.length === 0 ? (
          <div className="rounded-2xl border border-violet-100 bg-white p-10 text-center text-sm text-gray-600 shadow-sm">
            <Ticket className="mx-auto mb-2 h-8 w-8 text-violet-300" />
            No promo codes yet. Create your first to start running campaigns.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-violet-50 text-left text-xs uppercase tracking-wider text-violet-700">
                  <tr>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Discount</th>
                    <th className="px-4 py-3">Conditions</th>
                    <th className="px-4 py-3">Active window</th>
                    <th className="px-4 py-3">Usage</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {promos.map((promo) => {
                    const isBusy = busyPromoId === promo.id;
                    const valueLabel =
                      promo.discountType === "PERCENT"
                        ? `${promo.value}%`
                        : formatCurrency(
                            promo.value,
                            settings?.currency ?? "BDT",
                          );

                    return (
                      <tr
                        key={promo.id}
                        className="border-t border-violet-100/70 align-top"
                      >
                        <td className="px-4 py-3">
                          <p className="font-mono text-sm font-bold uppercase text-violet-700">
                            {promo.code}
                          </p>
                          {promo.description && (
                            <p className="mt-1 text-xs text-gray-500">
                              {promo.description}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ring-inset",
                              TYPE_BADGE[promo.discountType],
                            )}
                          >
                            {promo.discountType}
                          </span>
                          <p className="mt-1 font-semibold text-gray-900">
                            {valueLabel}
                          </p>
                          {promo.maxDiscount != null &&
                            promo.discountType === "PERCENT" && (
                              <p className="text-xs text-gray-500">
                                Max{" "}
                                {formatCurrency(
                                  promo.maxDiscount,
                                  settings?.currency ?? "BDT",
                                )}
                              </p>
                            )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {promo.minOrder != null ? (
                            <p>
                              Min order:{" "}
                              <span className="font-semibold text-gray-800">
                                {formatCurrency(
                                  promo.minOrder,
                                  settings?.currency ?? "BDT",
                                )}
                              </span>
                            </p>
                          ) : (
                            <p>No minimum</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          <p>From: {formatDate(promo.startsAt)}</p>
                          <p>To: {formatDate(promo.endsAt)}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          <p className="font-semibold text-gray-900">
                            {promo.usedCount}
                            {promo.usageLimit != null && (
                              <span className="font-normal text-gray-500">
                                {" "}
                                / {promo.usageLimit}
                              </span>
                            )}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset",
                              STATUS_BADGE[promo.status],
                            )}
                          >
                            {promo.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditPromo(promo)}
                              disabled={isBusy}
                              className="inline-flex items-center gap-1 rounded-lg border border-violet-200 px-2.5 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Pencil className="h-3.5 w-3.5" /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                void handleDeletePromo(promo);
                              }}
                              disabled={isBusy}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isBusy ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Promo create / edit drawer */}
      <div
        aria-hidden
        onClick={closePromoPanel}
        className={cn(
          "fixed inset-0 z-[60] bg-gray-900/35 backdrop-blur-[1px] transition-opacity duration-300",
          editing ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-[70] w-full max-w-md border-l border-violet-100 bg-white shadow-2xl transition-transform duration-300",
          editing ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-violet-100 bg-linear-to-r from-violet-600 to-indigo-700 px-5 py-4 text-white">
            <h2 className="text-lg font-bold">
              {editing?.mode === "create" ? "Create promo code" : "Edit promo code"}
            </h2>
            <p className="mt-0.5 text-xs text-violet-100">
              Customers apply these at checkout. Case-insensitive on the wire.
            </p>
          </div>

          <form onSubmit={handlePromoSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Code" required>
                  <input
                    value={promoForm.code}
                    onChange={(e) =>
                      setPromoForm((prev) => ({ ...prev, code: e.target.value }))
                    }
                    className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm font-mono uppercase outline-none transition focus:border-violet-500"
                    placeholder="ENTERFLY10"
                  />
                </Field>
                <Field label="Status" required>
                  <select
                    value={promoForm.status}
                    onChange={(e) =>
                      setPromoForm((prev) => ({
                        ...prev,
                        status: e.target.value as PromoCodeStatus,
                      }))
                    }
                    className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
                  >
                    {PROMO_STATUS_VALUES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Description">
                <textarea
                  value={promoForm.description}
                  onChange={(e) =>
                    setPromoForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="min-h-20 w-full rounded-xl border border-violet-200 px-3 py-2 text-sm outline-none transition focus:border-violet-500"
                  placeholder="What this code does, shown internally."
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Discount type" required>
                  <select
                    value={promoForm.discountType}
                    onChange={(e) =>
                      setPromoForm((prev) => ({
                        ...prev,
                        discountType: e.target.value as PromoDiscountType,
                      }))
                    }
                    className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
                  >
                    {DISCOUNT_TYPE_VALUES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  label={
                    promoForm.discountType === "PERCENT"
                      ? "Value (%)"
                      : "Value (currency)"
                  }
                  required
                >
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={promoForm.value}
                    onChange={(e) =>
                      setPromoForm((prev) => ({
                        ...prev,
                        value: e.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
                    placeholder={
                      promoForm.discountType === "PERCENT" ? "10" : "500"
                    }
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Minimum order">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={promoForm.minOrder}
                    onChange={(e) =>
                      setPromoForm((prev) => ({
                        ...prev,
                        minOrder: e.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
                    placeholder="Optional"
                  />
                </Field>
                <Field
                  label="Max discount"
                  hint={
                    promoForm.discountType === "PERCENT"
                      ? "Cap on percentage discount."
                      : undefined
                  }
                >
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={promoForm.maxDiscount}
                    onChange={(e) =>
                      setPromoForm((prev) => ({
                        ...prev,
                        maxDiscount: e.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
                    placeholder="Optional"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Starts at">
                  <input
                    type="datetime-local"
                    value={promoForm.startsAt}
                    onChange={(e) =>
                      setPromoForm((prev) => ({
                        ...prev,
                        startsAt: e.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
                  />
                </Field>
                <Field label="Ends at">
                  <input
                    type="datetime-local"
                    value={promoForm.endsAt}
                    onChange={(e) =>
                      setPromoForm((prev) => ({
                        ...prev,
                        endsAt: e.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
                  />
                </Field>
              </div>

              <Field
                label="Usage limit"
                hint="Total redemptions allowed across all customers."
              >
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={promoForm.usageLimit}
                  onChange={(e) =>
                    setPromoForm((prev) => ({
                      ...prev,
                      usageLimit: e.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
                  placeholder="Optional"
                />
              </Field>
            </div>

            <div className="border-t border-violet-100 bg-white px-5 py-4">
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closePromoPanel}
                  className="h-10 rounded-xl border border-violet-200 px-4 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPromo || !editing}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 px-4 text-sm font-semibold text-white transition hover:from-violet-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmittingPromo && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {editing?.mode === "create" ? "Create" : "Save changes"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </aside>
    </section>
  );
}

type SummaryAccent = "violet" | "emerald" | "amber";

const ACCENT_STYLES: Record<SummaryAccent, string> = {
  violet: "from-violet-500/10 to-indigo-500/10 text-violet-700",
  emerald: "from-emerald-500/10 to-teal-500/10 text-emerald-700",
  amber: "from-amber-500/10 to-orange-500/10 text-amber-700",
};

function SummaryCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: SummaryAccent;
}) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {icon}
        {label}
      </p>
      <p
        className={cn(
          "mt-2 inline-flex rounded-xl bg-linear-to-r px-3 py-1.5 text-sm font-bold",
          ACCENT_STYLES[accent],
        )}
      >
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  icon,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="flex items-center gap-1.5 font-semibold text-gray-700">
        {icon}
        {label}
        {required && <span className="ml-0.5 text-rose-600">*</span>}
      </span>
      {children}
      {hint && <span className="text-[11px] text-gray-500">{hint}</span>}
    </label>
  );
}
