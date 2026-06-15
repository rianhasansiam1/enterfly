"use client";

import {
  CAROUSEL_BG_TYPES,
  STATUS_VALUES,
  type BannerStatus,
  type CarouselBgType,
  type CarouselFormState,
  type CategoryBannerFormState,
  type DealFormState,
  type PromoFormState,
  type TopFormState,
} from "@/features/admin-banners/api";
import type { CategoryOption } from "@/features/admin-products/api";
import ImageUploader from "@/components/ui/ImageUploader";
import AdvancedColorPicker from "@/components/ui/AdvancedColorPicker";

import Field from "@/app/admin/components/Field";

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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
      <Field label="Background style" required>
        <select
          value={form.bgType}
          onChange={(e) =>
            update("bgType", e.target.value as CarouselBgType)
          }
          className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
        >
          {CAROUSEL_BG_TYPES.map((type) => (
            <option key={type} value={type}>
              {type === "gradient" ? "Gradient" : "Solid color"}
            </option>
          ))}
        </select>
      </Field>
      {form.bgType === "solid" ? (
        <Field label="Background color" required>
          <AdvancedColorPicker
            label="Background color"
            value={form.bgColor}
            onChange={(value) => update("bgColor", value)}
          />
        </Field>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="From" required>
            <AdvancedColorPicker
              label="Gradient from color"
              value={form.bgFrom}
              onChange={(value) => update("bgFrom", value)}
            />
          </Field>
          <Field label="Via">
            <AdvancedColorPicker
              label="Gradient via color"
              value={form.bgVia}
              onChange={(value) => update("bgVia", value)}
            />
          </Field>
          <Field label="To" required>
            <AdvancedColorPicker
              label="Gradient to color"
              value={form.bgTo}
              onChange={(value) => update("bgTo", value)}
            />
          </Field>
        </div>
      )}
      <Field label="Link">
        <input
          value={form.link}
          onChange={(e) => update("link", e.target.value)}
          className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
          placeholder="/products?category=grocery"
        />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
      <Field label="Background color" required>
        <AdvancedColorPicker
          label="Deal background color"
          value={form.bgClass}
          onChange={(value) => update("bgClass", value)}
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
      <Field label="Background color" required>
        <AdvancedColorPicker
          label="Promo background color"
          value={form.bgClass}
          onChange={(value) => update("bgClass", value)}
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
      <Field label="Link">
        <input
          value={form.link}
          onChange={(e) => update("link", e.target.value)}
          className="h-10 w-full rounded-xl border border-violet-200 px-3 text-sm outline-none transition focus:border-violet-500"
          placeholder="/products?sort=deals"
        />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
