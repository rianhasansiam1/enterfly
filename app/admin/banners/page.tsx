"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image as ImageIcon,
  Layers,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import {
  removeCarouselBanner,
  removeCategoryBanner,
  removeDealBanner,
  removePromoBanner,
  removeTopBanner,
  setAdminBanners,
  setAdminBannersError,
  setAdminBannersLoading,
  upsertCarouselBanner,
  upsertCategoryBanner,
  upsertDealBanner,
  upsertPromoBanner,
  upsertTopBanner,
} from "@/store/slices/admin-banners.slice";
import type { AppDispatch, RootState } from "@/store";
import {
  buildCarouselForm,
  buildCategoryBannerForm,
  buildDealForm,
  buildPromoForm,
  buildTopForm,
  createCarouselBanner,
  createCategoryBanner,
  createDealBanner,
  createPromoBanner,
  createTopBanner,
  deleteCarouselBanner,
  deleteCategoryBanner,
  deleteDealBanner,
  deletePromoBanner,
  deleteTopBanner,
  EMPTY_CAROUSEL_FORM,
  EMPTY_CATEGORY_BANNER_FORM,
  EMPTY_DEAL_FORM,
  EMPTY_PROMO_FORM,
  EMPTY_TOP_FORM,
  fetchAllBanners,
  formatDate,
  parseIntSafe,
  STATUS_VALUES,
  updateCarouselBanner,
  updateCategoryBanner,
  updateDealBanner,
  updatePromoBanner,
  updateTopBanner,
  type BannerKind,
  type BannerStatus,
  type CarouselBannerRow,
  type CarouselFormState,
  type CategoryBannerFormState,
  type CategoryBannerRow,
  type DealBannerRow,
  type DealFormState,
  type PromoBannerRow,
  type PromoFormState,
  type TopBannerRow,
  type TopFormState,
} from "@/features/admin-banners/api";
import {
  fetchActiveCategories,
  type CategoryOption,
} from "@/features/admin-products/api";
import { cn } from "@/lib/utils";
import ImageUploader from "@/components/ui/ImageUploader";

const STATUS_BADGE: Record<BannerStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  INACTIVE: "bg-amber-50 text-amber-700 ring-amber-200",
};

const TABS: { kind: BannerKind; label: string; description: string }[] = [
  {
    kind: "carousel",
    label: "Hero carousel",
    description: "Rotating slides on the home page hero.",
  },
  {
    kind: "category",
    label: "Category banners",
    description: "Side rail attached to a category strip on the home page.",
  },
  {
    kind: "top",
    label: "Top strip",
    description: "Thin promotional strip pinned to the top of the site.",
  },
  {
    kind: "deal",
    label: "Product deals",
    description: "Horizontal deal carousel on the product-details page.",
  },
  {
    kind: "promo",
    label: "Product promos",
    description: "Tall side-rail promo banners on the product-details page.",
  },
];

type EditingState =
  | { mode: "create"; kind: BannerKind }
  | { mode: "edit"; kind: "carousel"; banner: CarouselBannerRow }
  | { mode: "edit"; kind: "category"; banner: CategoryBannerRow }
  | { mode: "edit"; kind: "top"; banner: TopBannerRow }
  | { mode: "edit"; kind: "deal"; banner: DealBannerRow }
  | { mode: "edit"; kind: "promo"; banner: PromoBannerRow }
  | null;

export default function AdminBannersPage() {
  const dispatch = useDispatch<AppDispatch>();
  const carousel = useSelector((s: RootState) => s.adminBanners.carousel);
  const categoryBanners = useSelector(
    (s: RootState) => s.adminBanners.category,
  );
  const top = useSelector((s: RootState) => s.adminBanners.top);
  const deal = useSelector((s: RootState) => s.adminBanners.deal);
  const promo = useSelector((s: RootState) => s.adminBanners.promo);
  const isHydrated = useSelector(
    (s: RootState) => s.adminBanners.isHydrated,
  );
  const isLoading = useSelector(
    (s: RootState) => s.adminBanners.isLoading,
  );
  const error = useSelector((s: RootState) => s.adminBanners.error);

  const [activeTab, setActiveTab] = useState<BannerKind>("carousel");
  const [editing, setEditing] = useState<EditingState>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);

  const [carouselForm, setCarouselForm] =
    useState<CarouselFormState>(EMPTY_CAROUSEL_FORM);
  const [categoryForm, setCategoryForm] = useState<CategoryBannerFormState>(
    EMPTY_CATEGORY_BANNER_FORM,
  );
  const [topForm, setTopForm] = useState<TopFormState>(EMPTY_TOP_FORM);
  const [dealForm, setDealForm] = useState<DealFormState>(EMPTY_DEAL_FORM);
  const [promoForm, setPromoForm] = useState<PromoFormState>(EMPTY_PROMO_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    dispatch(setAdminBannersLoading(true));
    dispatch(setAdminBannersError(null));
    try {
      const bundle = await fetchAllBanners();
      dispatch(setAdminBanners(bundle));
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Failed to load banners.";
      dispatch(setAdminBannersError(message));
    } finally {
      dispatch(setAdminBannersLoading(false));
    }
  }, [dispatch]);

  useEffect(() => {
    if (isHydrated) return;
    void refresh();
  }, [isHydrated, refresh]);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      try {
        const rows = await fetchActiveCategories();
        if (!ignore) {
          setCategories(rows);
          setCategoriesError(null);
        }
      } catch (loadError) {
        if (!ignore) {
          const message =
            loadError instanceof Error
              ? loadError.message
              : "Failed to load categories.";
          setCategoriesError(message);
        }
      }
    };
    void run();
    return () => {
      ignore = true;
    };
  }, []);

  const totals = useMemo(() => {
    return {
      carousel: carousel.length,
      category: categoryBanners.length,
      top: top.length,
      deal: deal.length,
      promo: promo.length,
      activeCarousel: carousel.filter((b) => b.status === "ACTIVE").length,
      activeCategory: categoryBanners.filter((b) => b.status === "ACTIVE")
        .length,
      activeTop: top.filter((b) => b.status === "ACTIVE").length,
      activeDeal: deal.filter((b) => b.status === "ACTIVE").length,
      activePromo: promo.filter((b) => b.status === "ACTIVE").length,
    };
  }, [carousel, categoryBanners, deal, promo, top]);

  /* ---------------------------- Open / close panels ---------------------- */

  const openCreate = (kind: BannerKind) => {
    setEditing({ mode: "create", kind });
    setMutationError(null);
    if (kind === "carousel") setCarouselForm(EMPTY_CAROUSEL_FORM);
    if (kind === "category")
      setCategoryForm({
        ...EMPTY_CATEGORY_BANNER_FORM,
        categoryId: categories[0]?.id ?? "",
      });
    if (kind === "top") setTopForm(EMPTY_TOP_FORM);
    if (kind === "deal") setDealForm(EMPTY_DEAL_FORM);
    if (kind === "promo") setPromoForm(EMPTY_PROMO_FORM);
  };

  const openEditCarousel = (banner: CarouselBannerRow) => {
    setEditing({ mode: "edit", kind: "carousel", banner });
    setCarouselForm(buildCarouselForm(banner));
    setMutationError(null);
  };

  const openEditCategory = (banner: CategoryBannerRow) => {
    setEditing({ mode: "edit", kind: "category", banner });
    setCategoryForm(buildCategoryBannerForm(banner));
    setMutationError(null);
  };

  const openEditTop = (banner: TopBannerRow) => {
    setEditing({ mode: "edit", kind: "top", banner });
    setTopForm(buildTopForm(banner));
    setMutationError(null);
  };

  const openEditDeal = (banner: DealBannerRow) => {
    setEditing({ mode: "edit", kind: "deal", banner });
    setDealForm(buildDealForm(banner));
    setMutationError(null);
  };

  const openEditPromo = (banner: PromoBannerRow) => {
    setEditing({ mode: "edit", kind: "promo", banner });
    setPromoForm(buildPromoForm(banner));
    setMutationError(null);
  };

  const closePanel = () => {
    setEditing(null);
    setMutationError(null);
  };

  /* ---------------------------- Submit handlers -------------------------- */

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    setMutationError(null);
    setSuccessNote(null);
    setIsSubmitting(true);

    try {
      if (editing.kind === "carousel") {
        const position = parseIntSafe(carouselForm.position, "Position");
        const body = {
          image: carouselForm.image.trim(),
          title: carouselForm.title.trim(),
          subtitle: carouselForm.subtitle.trim(),
          description: carouselForm.description.trim(),
          badge: carouselForm.badge.trim(),
          bgFrom: carouselForm.bgFrom.trim(),
          bgVia: carouselForm.bgVia.trim() || null,
          bgTo: carouselForm.bgTo.trim(),
          link: carouselForm.link.trim() || null,
          position,
          status: carouselForm.status,
        };
        if (editing.mode === "create") {
          const row = await createCarouselBanner(body);
          dispatch(upsertCarouselBanner(row));
          setSuccessNote("Carousel slide created.");
        } else {
          const row = await updateCarouselBanner(editing.banner.id, body);
          dispatch(upsertCarouselBanner(row));
          setSuccessNote("Carousel slide updated.");
        }
      } else if (editing.kind === "category") {
        if (!categoryForm.categoryId) {
          throw new Error("Category is required.");
        }
        const body = {
          image: categoryForm.image.trim(),
          label: categoryForm.label.trim(),
          heading: categoryForm.heading.trim(),
          discount: categoryForm.discount.trim(),
          description: categoryForm.description.trim(),
          link: categoryForm.link.trim() || null,
          categoryId: categoryForm.categoryId,
          status: categoryForm.status,
        };
        if (editing.mode === "create") {
          const row = await createCategoryBanner(body);
          dispatch(upsertCategoryBanner(row));
          setSuccessNote("Category banner created.");
        } else {
          const row = await updateCategoryBanner(editing.banner.id, body);
          dispatch(upsertCategoryBanner(row));
          setSuccessNote("Category banner updated.");
        }
      } else if (editing.kind === "top") {
        const position = parseIntSafe(topForm.position, "Position");
        const body = {
          icon: topForm.icon.trim(),
          badge: topForm.badge.trim(),
          discount: topForm.discount.trim(),
          description: topForm.description.trim(),
          tag: topForm.tag.trim(),
          tagIcon: topForm.tagIcon.trim(),
          position,
          status: topForm.status,
        };
        if (editing.mode === "create") {
          const row = await createTopBanner(body);
          dispatch(upsertTopBanner(row));
          setSuccessNote("Top banner created.");
        } else {
          const row = await updateTopBanner(editing.banner.id, body);
          dispatch(upsertTopBanner(row));
          setSuccessNote("Top banner updated.");
        }
      } else if (editing.kind === "deal") {
        const position = parseIntSafe(dealForm.position, "Position");
        const body = {
          image: dealForm.image.trim(),
          title: dealForm.title.trim(),
          subtitle: dealForm.subtitle.trim(),
          bgClass: dealForm.bgClass.trim(),
          link: dealForm.link.trim() || null,
          position,
          status: dealForm.status,
        };
        if (editing.mode === "create") {
          const row = await createDealBanner(body);
          dispatch(upsertDealBanner(row));
          setSuccessNote("Deal banner created.");
        } else {
          const row = await updateDealBanner(editing.banner.id, body);
          dispatch(upsertDealBanner(row));
          setSuccessNote("Deal banner updated.");
        }
      } else {
        const position = parseIntSafe(promoForm.position, "Position");
        const body = {
          image: promoForm.image.trim(),
          title: promoForm.title.trim(),
          subtitle: promoForm.subtitle.trim(),
          discount: promoForm.discount.trim(),
          bgClass: promoForm.bgClass.trim(),
          link: promoForm.link.trim() || null,
          position,
          status: promoForm.status,
        };
        if (editing.mode === "create") {
          const row = await createPromoBanner(body);
          dispatch(upsertPromoBanner(row));
          setSuccessNote("Promo banner created.");
        } else {
          const row = await updatePromoBanner(editing.banner.id, body);
          dispatch(upsertPromoBanner(row));
          setSuccessNote("Promo banner updated.");
        }
      }
      closePanel();
    } catch (mutation) {
      const message =
        mutation instanceof Error ? mutation.message : "Banner mutation failed.";
      setMutationError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------------------------- Delete handlers -------------------------- */

  const confirmAndDelete = (kind: BannerKind, label: string) => {
    if (typeof window === "undefined") return true;
    return window.confirm(`Delete this ${label}? This cannot be undone.`);
  };

  const handleDeleteCarousel = async (banner: CarouselBannerRow) => {
    if (!confirmAndDelete("carousel", "carousel slide")) return;
    setMutationError(null);
    setSuccessNote(null);
    setBusyId(banner.id);
    try {
      await deleteCarouselBanner(banner.id);
      dispatch(removeCarouselBanner(banner.id));
      setSuccessNote("Carousel slide deleted.");
    } catch (mutation) {
      const message =
        mutation instanceof Error ? mutation.message : "Delete failed.";
      setMutationError(message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteCategory = async (banner: CategoryBannerRow) => {
    if (!confirmAndDelete("category", "category banner")) return;
    setMutationError(null);
    setSuccessNote(null);
    setBusyId(banner.id);
    try {
      await deleteCategoryBanner(banner.id);
      dispatch(removeCategoryBanner(banner.id));
      setSuccessNote("Category banner deleted.");
    } catch (mutation) {
      const message =
        mutation instanceof Error ? mutation.message : "Delete failed.";
      setMutationError(message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteTop = async (banner: TopBannerRow) => {
    if (!confirmAndDelete("top", "top strip")) return;
    setMutationError(null);
    setSuccessNote(null);
    setBusyId(banner.id);
    try {
      await deleteTopBanner(banner.id);
      dispatch(removeTopBanner(banner.id));
      setSuccessNote("Top banner deleted.");
    } catch (mutation) {
      const message =
        mutation instanceof Error ? mutation.message : "Delete failed.";
      setMutationError(message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteDeal = async (banner: DealBannerRow) => {
    if (!confirmAndDelete("deal", "deal banner")) return;
    setMutationError(null);
    setSuccessNote(null);
    setBusyId(banner.id);
    try {
      await deleteDealBanner(banner.id);
      dispatch(removeDealBanner(banner.id));
      setSuccessNote("Deal banner deleted.");
    } catch (mutation) {
      const message =
        mutation instanceof Error ? mutation.message : "Delete failed.";
      setMutationError(message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDeletePromo = async (banner: PromoBannerRow) => {
    if (!confirmAndDelete("promo", "promo banner")) return;
    setMutationError(null);
    setSuccessNote(null);
    setBusyId(banner.id);
    try {
      await deletePromoBanner(banner.id);
      dispatch(removePromoBanner(banner.id));
      setSuccessNote("Promo banner deleted.");
    } catch (mutation) {
      const message =
        mutation instanceof Error ? mutation.message : "Delete failed.";
      setMutationError(message);
    } finally {
      setBusyId(null);
    }
  };

  /* ---------------------------- Render ----------------------------------- */

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <SummaryCard
          icon={<Layers className="h-4 w-4" />}
          label="Hero carousel"
          value={`${totals.activeCarousel} / ${totals.carousel} active`}
          accent="violet"
        />
        <SummaryCard
          icon={<ImageIcon className="h-4 w-4" />}
          label="Category banners"
          value={`${totals.activeCategory} / ${totals.category} active`}
          accent="emerald"
        />
        <SummaryCard
          icon={<Sparkles className="h-4 w-4" />}
          label="Top strip"
          value={`${totals.activeTop} / ${totals.top} active`}
          accent="amber"
        />
        <SummaryCard
          icon={<Layers className="h-4 w-4" />}
          label="Product deals"
          value={`${totals.activeDeal} / ${totals.deal} active`}
          accent="violet"
        />
        <SummaryCard
          icon={<ImageIcon className="h-4 w-4" />}
          label="Product promos"
          value={`${totals.activePromo} / ${totals.promo} active`}
          accent="emerald"
        />
      </div>

      <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {TABS.map((tab) => {
              const isActive = tab.kind === activeTab;
              return (
                <button
                  key={tab.kind}
                  type="button"
                  onClick={() => setActiveTab(tab.kind)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm font-semibold transition",
                    isActive
                      ? "border-violet-500 bg-violet-600 text-white shadow"
                      : "border-violet-200 text-violet-700 hover:bg-violet-50",
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void refresh();
              }}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-violet-200 px-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
            >
              <RotateCcw className="h-4 w-4" />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => openCreate(activeTab)}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 px-4 text-sm font-semibold text-white transition hover:from-violet-700 hover:to-indigo-700"
            >
              <Plus className="h-4 w-4" />
              New {TABS.find((t) => t.kind === activeTab)?.label.toLowerCase()}
            </button>
          </div>
        </div>

        <p className="mt-3 text-xs text-gray-500">
          {TABS.find((t) => t.kind === activeTab)?.description}
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {categoriesError && activeTab === "category" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          {categoriesError}
        </div>
      )}

      {mutationError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {mutationError}
        </div>
      )}

      {successNote && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {successNote}
        </div>
      )}

      {isLoading && !isHydrated ? (
        <div className="rounded-2xl border border-violet-100 bg-white p-10 text-center text-sm text-violet-700 shadow-sm">
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading banners...
          </span>
        </div>
      ) : activeTab === "carousel" ? (
        <CarouselList
          rows={carousel}
          busyId={busyId}
          onEdit={openEditCarousel}
          onDelete={handleDeleteCarousel}
        />
      ) : activeTab === "category" ? (
        <CategoryList
          rows={categoryBanners}
          busyId={busyId}
          onEdit={openEditCategory}
          onDelete={handleDeleteCategory}
        />
      ) : activeTab === "top" ? (
        <TopList
          rows={top}
          busyId={busyId}
          onEdit={openEditTop}
          onDelete={handleDeleteTop}
        />
      ) : activeTab === "deal" ? (
        <DealList
          rows={deal}
          busyId={busyId}
          onEdit={openEditDeal}
          onDelete={handleDeleteDeal}
        />
      ) : (
        <PromoList
          rows={promo}
          busyId={busyId}
          onEdit={openEditPromo}
          onDelete={handleDeletePromo}
        />
      )}

      <div
        aria-hidden
        onClick={closePanel}
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
              {editing?.mode === "create" ? "Create banner" : "Edit banner"}
            </h2>
            <p className="mt-0.5 text-xs text-violet-100">
              {editing
                ? TABS.find((t) => t.kind === editing.kind)?.description
                : ""}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {editing?.kind === "carousel" && (
                <CarouselFormFields
                  form={carouselForm}
                  setForm={setCarouselForm}
                />
              )}
              {editing?.kind === "category" && (
                <CategoryBannerFormFields
                  form={categoryForm}
                  setForm={setCategoryForm}
                  categories={categories}
                />
              )}
              {editing?.kind === "top" && (
                <TopFormFields form={topForm} setForm={setTopForm} />
              )}
              {editing?.kind === "deal" && (
                <DealFormFields form={dealForm} setForm={setDealForm} />
              )}
              {editing?.kind === "promo" && (
                <PromoFormFields form={promoForm} setForm={setPromoForm} />
              )}
            </div>

            <div className="border-t border-violet-100 bg-white px-5 py-4">
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closePanel}
                  className="h-10 rounded-xl border border-violet-200 px-4 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !editing}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 px-4 text-sm font-semibold text-white transition hover:from-violet-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
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

/* ---------------------------- Lists per tab ------------------------------- */

function CarouselList({
  rows,
  busyId,
  onEdit,
  onDelete,
}: {
  rows: CarouselBannerRow[];
  busyId: string | null;
  onEdit: (banner: CarouselBannerRow) => void;
  onDelete: (banner: CarouselBannerRow) => void;
}) {
  if (rows.length === 0) return <EmptyState label="No carousel slides yet." />;

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {rows.map((banner) => (
        <article
          key={banner.id}
          className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm"
        >
          <div className="relative h-32 w-full overflow-hidden bg-gray-100">
            <img
              src={banner.image}
              alt={banner.title}
              className="h-full w-full object-cover"
            />
            <span
              className={cn(
                "absolute right-2 top-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ring-inset",
                STATUS_BADGE[banner.status],
              )}
            >
              {banner.status}
            </span>
          </div>
          <div className="space-y-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-500">
                  {banner.badge}
                </p>
                <h3 className="truncate text-base font-bold text-gray-900">
                  {banner.title}{" "}
                  <span className="font-medium text-gray-500">
                    · {banner.subtitle}
                  </span>
                </h3>
              </div>
              <span className="rounded-lg bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700">
                #{banner.position}
              </span>
            </div>
            <p className="line-clamp-2 text-xs text-gray-500">
              {banner.description}
            </p>
            <p className="text-[11px] text-gray-400">
              {banner.bgFrom} {banner.bgVia ? `→ ${banner.bgVia}` : ""} →{" "}
              {banner.bgTo}
              {banner.link && (
                <span className="ml-2 font-mono">→ {banner.link}</span>
              )}
            </p>
            <RowFooter
              busyId={busyId}
              banner={banner}
              onEdit={() => onEdit(banner)}
              onDelete={() => onDelete(banner)}
            />
          </div>
        </article>
      ))}
    </div>
  );
}

function CategoryList({
  rows,
  busyId,
  onEdit,
  onDelete,
}: {
  rows: CategoryBannerRow[];
  busyId: string | null;
  onEdit: (banner: CategoryBannerRow) => void;
  onDelete: (banner: CategoryBannerRow) => void;
}) {
  if (rows.length === 0) return <EmptyState label="No category banners yet." />;

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {rows.map((banner) => (
        <article
          key={banner.id}
          className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm"
        >
          <div className="relative h-32 w-full overflow-hidden bg-gray-100">
            <img
              src={banner.image}
              alt={banner.heading}
              className="h-full w-full object-cover"
            />
            <span
              className={cn(
                "absolute right-2 top-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ring-inset",
                STATUS_BADGE[banner.status],
              )}
            >
              {banner.status}
            </span>
          </div>
          <div className="space-y-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">
                  {banner.label}
                </p>
                <h3 className="truncate text-base font-bold text-gray-900">
                  {banner.heading}
                </h3>
              </div>
              <span className="rounded-lg bg-yellow-100 px-2 py-1 text-xs font-bold text-amber-700">
                {banner.discount}
              </span>
            </div>
            <p className="line-clamp-2 text-xs text-gray-500">
              {banner.description}
            </p>
            <p className="text-[11px] text-gray-400">
              Linked to:{" "}
              <span className="font-semibold text-violet-700">
                {banner.category.name || banner.categoryId}
              </span>
              {banner.link && (
                <span className="ml-2 font-mono">→ {banner.link}</span>
              )}
            </p>
            <RowFooter
              busyId={busyId}
              banner={banner}
              onEdit={() => onEdit(banner)}
              onDelete={() => onDelete(banner)}
            />
          </div>
        </article>
      ))}
    </div>
  );
}

function TopList({
  rows,
  busyId,
  onEdit,
  onDelete,
}: {
  rows: TopBannerRow[];
  busyId: string | null;
  onEdit: (banner: TopBannerRow) => void;
  onDelete: (banner: TopBannerRow) => void;
}) {
  if (rows.length === 0) return <EmptyState label="No top strip slides yet." />;

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {rows.map((banner) => (
        <article
          key={banner.id}
          className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm"
        >
          <div className="relative bg-linear-to-r from-violet-600 via-violet-500 to-indigo-500 px-4 py-3 text-white">
            <span
              className={cn(
                "absolute right-2 top-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ring-inset",
                STATUS_BADGE[banner.status],
              )}
            >
              {banner.status}
            </span>
            <p className="text-xs font-semibold uppercase tracking-wide">
              {banner.icon} · {banner.badge}
            </p>
            <p className="text-sm">
              <span className="text-yellow-300 font-extrabold">
                {banner.discount}
              </span>{" "}
              {banner.description}
            </p>
            <p className="text-[11px] opacity-90">
              {banner.tagIcon} · {banner.tag}
            </p>
          </div>
          <div className="space-y-2 p-4">
            <p className="text-[11px] text-gray-400">
              Position{" "}
              <span className="font-semibold text-violet-700">
                #{banner.position}
              </span>
              <span className="mx-2">·</span>
              Created {formatDate(banner.createdAt)}
            </p>
            <RowFooter
              busyId={busyId}
              banner={banner}
              onEdit={() => onEdit(banner)}
              onDelete={() => onDelete(banner)}
            />
          </div>
        </article>
      ))}
    </div>
  );
}

function DealList({
  rows,
  busyId,
  onEdit,
  onDelete,
}: {
  rows: DealBannerRow[];
  busyId: string | null;
  onEdit: (banner: DealBannerRow) => void;
  onDelete: (banner: DealBannerRow) => void;
}) {
  if (rows.length === 0) return <EmptyState label="No deal banners yet." />;

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {rows.map((banner) => (
        <article
          key={banner.id}
          className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm"
        >
          <div className={cn("relative h-28 overflow-hidden", banner.bgClass)}>
            <img
              src={banner.image}
              alt={banner.title}
              className="h-full w-full object-cover opacity-60"
            />
            <span
              className={cn(
                "absolute right-2 top-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ring-inset",
                STATUS_BADGE[banner.status],
              )}
            >
              {banner.status}
            </span>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
              <p className="text-xs font-semibold opacity-90">
                {banner.subtitle}
              </p>
              <h3 className="text-lg font-black drop-shadow">{banner.title}</h3>
            </div>
          </div>
          <div className="space-y-2 p-3">
            <p className="text-[11px] text-gray-400">
              <span className="font-mono">{banner.bgClass}</span>
              <span className="mx-2">·</span>
              Position {banner.position}
            </p>
            {banner.link && (
              <p className="truncate text-[11px] text-gray-400">
                <span className="font-mono">→ {banner.link}</span>
              </p>
            )}
            <RowFooter
              busyId={busyId}
              banner={banner}
              onEdit={() => onEdit(banner)}
              onDelete={() => onDelete(banner)}
            />
          </div>
        </article>
      ))}
    </div>
  );
}

function PromoList({
  rows,
  busyId,
  onEdit,
  onDelete,
}: {
  rows: PromoBannerRow[];
  busyId: string | null;
  onEdit: (banner: PromoBannerRow) => void;
  onDelete: (banner: PromoBannerRow) => void;
}) {
  if (rows.length === 0) return <EmptyState label="No promo banners yet." />;

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {rows.map((banner) => (
        <article
          key={banner.id}
          className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm"
        >
          <div className={cn("relative h-44 overflow-hidden", banner.bgClass)}>
            <img
              src={banner.image}
              alt={banner.title}
              className="h-full w-full object-cover opacity-70"
            />
            <span
              className={cn(
                "absolute right-2 top-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ring-inset",
                STATUS_BADGE[banner.status],
              )}
            >
              {banner.status}
            </span>
            <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center text-white">
              <p className="text-xs font-medium opacity-80">SUPER SALE</p>
              <h3 className="text-2xl font-black drop-shadow">
                {banner.title}
              </h3>
              <p className="text-xl font-bold text-yellow-300">
                {banner.subtitle}
              </p>
              <span className="mt-2 rounded-full bg-white/20 px-3 py-1 text-sm font-semibold">
                {banner.discount}
              </span>
            </div>
          </div>
          <div className="space-y-2 p-3">
            <p className="text-[11px] text-gray-400">
              <span className="font-mono">{banner.bgClass}</span>
              <span className="mx-2">·</span>
              Position {banner.position}
              {banner.link && (
                <>
                  <span className="mx-2">·</span>
                  <span className="font-mono">→ {banner.link}</span>
                </>
              )}
            </p>
            <RowFooter
              busyId={busyId}
              banner={banner}
              onEdit={() => onEdit(banner)}
              onDelete={() => onDelete(banner)}
            />
          </div>
        </article>
      ))}
    </div>
  );
}

function RowFooter({
  busyId,
  banner,
  onEdit,
  onDelete,
}: {
  busyId: string | null;
  banner: { id: string };
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isBusy = busyId === banner.id;
  return (
    <div className="flex items-center justify-end gap-2 pt-1">
      <button
        type="button"
        onClick={onEdit}
        disabled={isBusy}
        className="inline-flex items-center gap-1 rounded-lg border border-violet-200 px-2.5 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Pencil className="h-3.5 w-3.5" /> Edit
      </button>
      <button
        type="button"
        onClick={onDelete}
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
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-10 text-center text-sm text-gray-600 shadow-sm">
      <ImageIcon className="mx-auto mb-2 h-8 w-8 text-violet-300" />
      {label}
    </div>
  );
}

/* ---------------------------- Form sections ------------------------------- */

function CarouselFormFields({
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
        <ImageUploader
          value={form.image}
          onChange={(url) => update("image", url)}
        />
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

function CategoryBannerFormFields({
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
        <ImageUploader
          value={form.image}
          onChange={(url) => update("image", url)}
        />
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

function DealFormFields({
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
        <ImageUploader
          value={form.image}
          onChange={(url) => update("image", url)}
        />
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

function PromoFormFields({
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
        <ImageUploader
          value={form.image}
          onChange={(url) => update("image", url)}
        />
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

function TopFormFields({
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

/* ---------------------------- Misc components ----------------------------- */

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
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-semibold text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-rose-600">*</span>}
      </span>
      {children}
    </label>
  );
}
