"use client";

import {
  STATUS_VALUES,
  type BannerStatus,
  type CarouselFormState,
  type CategoryBannerFormState,
  type DealFormState,
  type PromoFormState,
  type TopFormState,
} from "@/features/admin-banners/api";
import type { CategoryOption } from "@/features/admin-products/api";
import ImageUploader from "@/components/ui/ImageUploader";

import Field from "./Field";

export function CarouselFormFields({
  form,
  setForm,
}: {
  form: CarouselFormState;
  setForm: React.Dispatch<React.SetStateAction<CarouselFormState>>;
}) {
  const update = <K extends keyof CarouselFormState>(
    key: K,
    value: CarouselFormState[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <>
      <Field label="Image" required>
        <ImageUploader value={form.image} onChange={(url) => update("image", url)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Title" required>
          <input
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
            placeholder="25% OFF"
          />
        </Field>
        <Field label="Subtitle" required>
          <input
            value={form.subtitle}
            onChange={(e) => update("subtitle", e.target.value)}
            className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
            placeholder="VEGETABLES"
          />
        </Field>
      </div>
      <Field label="Badge" required>
        <input
          value={form.badge}
          onChange={(e) => update("badge", e.target.value)}
          className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
          placeholder="Weekend Special"
        />
      </Field>
      <Field label="Description" required>
        <textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          className="min-h-24 w-full rounded-xl border border-violet-200 px-3 py-2 text-sm outline-none transition focus:border-violet-500"
          placeholder="Short marketing copy"
        />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="bgFrom" required>
          <input
            value={form.bgFrom}
            onChange={(e) => update("bgFrom", e.target.value)}
            className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
            placeholder="from-green-500"
          />
        </Field>
        <Field label="bgVia">
          <input
            value={form.bgVia}
            onChange={(e) => update("bgVia", e.target.value)}
            className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
            placeholder="via-emerald-600"
          />
        </Field>
        <Field label="bgTo" required>
          <input
            value={form.bgTo}
            onChange={(e) => update("bgTo", e.target.value)}
            className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
            placeholder="to-green-800"
          />
        </Field>
      </div>
      <Field label="Link">
        <input
          value={form.link}
          onChange={(e) => update("link", e.target.value)}
          className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
          placeholder="/products?category=grocery"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Position" required>
          <input
            type="number"
            min="0"
            step="1"
            value={form.position}
            onChange={(e) => update("position", e.target.value)}
            className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
          />
        </Field>
        <Field label="Status" required>
          <select
            value={form.status}
            onChange={(e) => update("status", e.target.value as BannerStatus)}
            className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
          >
            {STATUS_VALUES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </>
  );
}

export function CategoryBannerFormFields({
  form,
  setForm,
  categories,
}: {
  form: CategoryBannerFormState;
  setForm: React.Dispatch<React.SetStateAction<CategoryBannerFormState>>;
  categories: CategoryOption[];
}) {
  const update = <K extends keyof CategoryBannerFormState>(
    key: K,
    value: CategoryBannerFormState[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <>
      <Field label="Category" required>
        <select
          value={form.categoryId}
          onChange={(e) => update("categoryId", e.target.value)}
          className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
        >
          <option value="">Select category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Image" required>
        <ImageUploader value={form.image} onChange={(url) => update("image", url)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Label" required>
          <input
            value={form.label}
            onChange={(e) => update("label", e.target.value)}
            className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
            placeholder="SALE"
          />
        </Field>
        <Field label="Discount" required>
          <input
            value={form.discount}
            onChange={(e) => update("discount", e.target.value)}
            className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
            placeholder="40%"
          />
        </Field>
      </div>
      <Field label="Heading" required>
        <input
          value={form.heading}
          onChange={(e) => update("heading", e.target.value)}
          className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
          placeholder="FLASH SALE"
        />
      </Field>
      <Field label="Description" required>
        <textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          className="min-h-24 w-full rounded-xl border border-violet-200 px-3 py-2 text-sm outline-none transition focus:border-violet-500"
          placeholder="Short banner copy"
        />
      </Field>
      <Field label="Link">
        <input
          value={form.link}
          onChange={(e) => update("link", e.target.value)}
          className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
          placeholder="/products?category=fashion"
        />
      </Field>
      <Field label="Status" required>
        <select
          value={form.status}
          onChange={(e) => update("status", e.target.value as BannerStatus)}
          className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
        >
          {STATUS_VALUES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>
    </>
  );
}

export function DealFormFields({
  form,
  setForm,
}: {
  form: DealFormState;
  setForm: React.Dispatch<React.SetStateAction<DealFormState>>;
}) {
  const update = <K extends keyof DealFormState>(
    key: K,
    value: DealFormState[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <>
      <Field label="Image" required>
        <ImageUploader value={form.image} onChange={(url) => update("image", url)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Title" required>
          <input
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
            placeholder="Up to 70% Off"
          />
        </Field>
        <Field label="Subtitle" required>
          <input
            value={form.subtitle}
            onChange={(e) => update("subtitle", e.target.value)}
            className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
            placeholder="Black Friday"
          />
        </Field>
      </div>
      <Field label="Background utility class" required>
        <input
          value={form.bgClass}
          onChange={(e) => update("bgClass", e.target.value)}
          className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
          placeholder="bg-rose-500"
        />
      </Field>
      <Field label="Link">
        <input
          value={form.link}
          onChange={(e) => update("link", e.target.value)}
          className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
          placeholder="/products?sale=black-friday"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Position" required>
          <input
            type="number"
            min="0"
            step="1"
            value={form.position}
            onChange={(e) => update("position", e.target.value)}
            className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
          />
        </Field>
        <Field label="Status" required>
          <select
            value={form.status}
            onChange={(e) => update("status", e.target.value as BannerStatus)}
            className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
          >
            {STATUS_VALUES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </>
  );
}

export function PromoFormFields({
  form,
  setForm,
}: {
  form: PromoFormState;
  setForm: React.Dispatch<React.SetStateAction<PromoFormState>>;
}) {
  const update = <K extends keyof PromoFormState>(
    key: K,
    value: PromoFormState[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <>
      <Field label="Image" required>
        <ImageUploader value={form.image} onChange={(url) => update("image", url)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Title" required>
          <input
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
            placeholder="Mega Sale"
          />
        </Field>
        <Field label="Subtitle" required>
          <input
            value={form.subtitle}
            onChange={(e) => update("subtitle", e.target.value)}
            className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
            placeholder="Save Big Today"
          />
        </Field>
      </div>
      <Field label="Discount" required>
        <input
          value={form.discount}
          onChange={(e) => update("discount", e.target.value)}
          className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
          placeholder="UP TO 60% OFF"
        />
      </Field>
      <Field label="Background utility class" required>
        <input
          value={form.bgClass}
          onChange={(e) => update("bgClass", e.target.value)}
          className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
          placeholder="bg-violet-700"
        />
      </Field>
      <Field label="Link">
        <input
          value={form.link}
          onChange={(e) => update("link", e.target.value)}
          className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
          placeholder="/products?sale=mega"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Position" required>
          <input
            type="number"
            min="0"
            step="1"
            value={form.position}
            onChange={(e) => update("position", e.target.value)}
            className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
          />
        </Field>
        <Field label="Status" required>
          <select
            value={form.status}
            onChange={(e) => update("status", e.target.value as BannerStatus)}
            className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
          >
            {STATUS_VALUES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </>
  );
}

export function TopFormFields({
  form,
  setForm,
}: {
  form: TopFormState;
  setForm: React.Dispatch<React.SetStateAction<TopFormState>>;
}) {
  const update = <K extends keyof TopFormState>(
    key: K,
    value: TopFormState[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Icon name" required>
          <input
            value={form.icon}
            onChange={(e) => update("icon", e.target.value)}
            className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
            placeholder="Tag, Gift, Percent..."
          />
        </Field>
        <Field label="Tag icon name" required>
          <input
            value={form.tagIcon}
            onChange={(e) => update("tagIcon", e.target.value)}
            className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
            placeholder="Sparkles, Zap..."
          />
        </Field>
      </div>
      <Field label="Badge" required>
        <input
          value={form.badge}
          onChange={(e) => update("badge", e.target.value)}
          className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
          placeholder="MEGA SALE"
        />
      </Field>
      <Field label="Discount" required>
        <input
          value={form.discount}
          onChange={(e) => update("discount", e.target.value)}
          className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
          placeholder="70% OFF"
        />
      </Field>
      <Field label="Description" required>
        <input
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
          placeholder="on all products"
        />
      </Field>
      <Field label="Tag" required>
        <input
          value={form.tag}
          onChange={(e) => update("tag", e.target.value)}
          className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
          placeholder="Limited Time Only"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Position" required>
          <input
            type="number"
            min="0"
            step="1"
            value={form.position}
            onChange={(e) => update("position", e.target.value)}
            className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
          />
        </Field>
        <Field label="Status" required>
          <select
            value={form.status}
            onChange={(e) => update("status", e.target.value as BannerStatus)}
            className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
          >
            {STATUS_VALUES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </>
  );
}
