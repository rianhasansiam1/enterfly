"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
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
  parseIntSafe,
  updateCarouselBanner,
  updateCategoryBanner,
  updateDealBanner,
  updatePromoBanner,
  updateTopBanner,
  type BannerKind,
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

import BannerSummaryCards from "./components/BannerSummaryCards";
import BannerTabsBar from "./components/BannerTabsBar";
import BannerFormDrawer from "./components/BannerFormDrawer";
import {
  CarouselList,
  CategoryList,
  DealList,
  PromoList,
  TopList,
} from "./components/BannerLists";
import type { EditingState } from "./components/constants";

export default function AdminBannersPage() {
  const dispatch = useDispatch<AppDispatch>();
  const carousel = useSelector((s: RootState) => s.adminBanners.carousel);
  const categoryBanners = useSelector(
    (s: RootState) => s.adminBanners.category,
  );
  const top = useSelector((s: RootState) => s.adminBanners.top);
  const deal = useSelector((s: RootState) => s.adminBanners.deal);
  const promo = useSelector((s: RootState) => s.adminBanners.promo);
  const isHydrated = useSelector((s: RootState) => s.adminBanners.isHydrated);
  const isLoading = useSelector((s: RootState) => s.adminBanners.isLoading);
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

  const confirmAndDelete = (label: string) => {
    if (typeof window === "undefined") return true;
    return window.confirm(`Delete this ${label}? This cannot be undone.`);
  };

  const handleDeleteCarousel = async (banner: CarouselBannerRow) => {
    if (!confirmAndDelete("carousel slide")) return;
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
    if (!confirmAndDelete("category banner")) return;
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
    if (!confirmAndDelete("top strip")) return;
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
    if (!confirmAndDelete("deal banner")) return;
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
    if (!confirmAndDelete("promo banner")) return;
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
      <BannerSummaryCards totals={totals} />

      <BannerTabsBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onRefresh={() => {
          void refresh();
        }}
        onCreate={() => openCreate(activeTab)}
      />

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
          onDelete={(banner) => {
            void handleDeleteCarousel(banner);
          }}
        />
      ) : activeTab === "category" ? (
        <CategoryList
          rows={categoryBanners}
          busyId={busyId}
          onEdit={openEditCategory}
          onDelete={(banner) => {
            void handleDeleteCategory(banner);
          }}
        />
      ) : activeTab === "top" ? (
        <TopList
          rows={top}
          busyId={busyId}
          onEdit={openEditTop}
          onDelete={(banner) => {
            void handleDeleteTop(banner);
          }}
        />
      ) : activeTab === "deal" ? (
        <DealList
          rows={deal}
          busyId={busyId}
          onEdit={openEditDeal}
          onDelete={(banner) => {
            void handleDeleteDeal(banner);
          }}
        />
      ) : (
        <PromoList
          rows={promo}
          busyId={busyId}
          onEdit={openEditPromo}
          onDelete={(banner) => {
            void handleDeletePromo(banner);
          }}
        />
      )}

      <BannerFormDrawer
        editing={editing}
        isSubmitting={isSubmitting}
        categories={categories}
        carouselForm={carouselForm}
        setCarouselForm={setCarouselForm}
        categoryForm={categoryForm}
        setCategoryForm={setCategoryForm}
        topForm={topForm}
        setTopForm={setTopForm}
        dealForm={dealForm}
        setDealForm={setDealForm}
        promoForm={promoForm}
        setPromoForm={setPromoForm}
        onClose={closePanel}
        onSubmit={handleSubmit}
      />
    </section>
  );
}
