"use client";

import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  prependAdminReview,
  removeAdminReview,
  setAdminReviewsPage,
  setAdminReviewsError,
  setAdminReviewsLoading,
} from "@/store/slices/admin-reviews.slice";
import type { AppDispatch, RootState } from "@/store";
import {
  deleteAdminReview,
  fetchAdminReviewsPage,
  type AdminReviewQueryParams,
  type ReviewSource,
} from "@/features/admin-reviews/api";
import {
  confirmMajorAction,
  notifyActionError,
  notifyActionSuccess,
} from "@/lib/admin-feedback";
import { useDebounce } from "@/hooks/useDebounce";
import { useAnimatedRemoval } from "@/hooks/useAnimatedRemoval";

import ReviewSummaryCards from "./components/ReviewSummaryCards";
import ReviewsToolbar from "./components/ReviewsToolbar";
import ReviewsTable from "./components/ReviewsTable";
import AddReviewForm from "./components/AddReviewForm";
import AdminPagination from "@/components/admin/AdminPagination";

type SourceFilter = "ALL" | ReviewSource;
type RatingFilter = "ALL" | 1 | 2 | 3 | 4 | 5;

const PAGE_SIZE = 20;

export default function AdminReviewsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const reviews = useSelector((state: RootState) => state.adminReviews.items);
  const meta = useSelector((state: RootState) => state.adminReviews.meta);
  const isLoading = useSelector(
    (state: RootState) => state.adminReviews.isLoading,
  );
  const error = useSelector((state: RootState) => state.adminReviews.error);

  // --- Server-driven query params ---
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("ALL");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("ALL");

  const debouncedSearch = useDebounce(search, 300);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const { visibleItems: animatedReviews, queueRemoval: queueReviewRemoval } =
    useAnimatedRemoval({
      items: reviews,
      getId: (review) => review.id,
    });

  const fetchPage = useCallback(
    async (params: AdminReviewQueryParams) => {
      dispatch(setAdminReviewsLoading(true));
      dispatch(setAdminReviewsError(null));
      try {
        const result = await fetchAdminReviewsPage(params);
        dispatch(setAdminReviewsPage(result));
      } catch (loadError) {
        const message =
          loadError instanceof Error
            ? loadError.message
            : "Failed to load reviews.";
        dispatch(setAdminReviewsError(message));
      } finally {
        dispatch(setAdminReviewsLoading(false));
      }
    },
    [dispatch],
  );

  useEffect(() => {
    const params: AdminReviewQueryParams = {
      page,
      pageSize: PAGE_SIZE,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (sourceFilter !== "ALL") params.source = sourceFilter;
    if (ratingFilter !== "ALL") params.rating = ratingFilter;

    void fetchPage(params);
  }, [page, debouncedSearch, sourceFilter, ratingFilter, fetchPage]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleSourceChange = useCallback((value: SourceFilter) => {
    setSourceFilter(value);
    setPage(1);
  }, []);

  const handleRatingChange = useCallback((value: RatingFilter) => {
    setRatingFilter(value);
    setPage(1);
  }, []);

  const handleRefresh = useCallback(() => {
    const params: AdminReviewQueryParams = {
      page,
      pageSize: PAGE_SIZE,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (sourceFilter !== "ALL") params.source = sourceFilter;
    if (ratingFilter !== "ALL") params.rating = ratingFilter;
    void fetchPage(params);
  }, [page, debouncedSearch, sourceFilter, ratingFilter, fetchPage]);

  const handleDelete = async (id: string) => {
    const confirmed = await confirmMajorAction({
      title: "Delete this review?",
      description: "This action cannot be undone.",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!confirmed) return;

    queueReviewRemoval(
      id,
      async () => {
        setMutationError(null);
        setSuccessNote(null);
        setBusyId(id);
        try {
          await deleteAdminReview(id);
          dispatch(removeAdminReview(id));
          setSuccessNote("Review deleted.");
          notifyActionSuccess("Review deleted.");
        } catch (mutation) {
          const message =
            mutation instanceof Error
              ? mutation.message
              : "Failed to delete the review.";
          setMutationError(message);
          throw new Error(message);
        } finally {
          setBusyId(null);
        }
      },
      (error) => {
        notifyActionError(error, "Failed to delete the review.");
      },
    );
  };

  return (
    <section className="space-y-4">
      <ReviewSummaryCards
        total={meta?.total ?? reviews.length}
        average={meta?.averageRating ?? 0}
        adminCount={meta?.adminCount ?? 0}
      />

      <ReviewsToolbar
        query={search}
        sourceFilter={sourceFilter}
        ratingFilter={ratingFilter}
        visibleCount={animatedReviews.length}
        totalCount={meta?.total ?? reviews.length}
        isLoading={isLoading}
        showAddForm={showAddForm}
        onQueryChange={handleSearchChange}
        onSourceChange={handleSourceChange}
        onRatingChange={handleRatingChange}
        onToggleAddForm={() => {
          setShowAddForm((open) => !open);
          setMutationError(null);
          setSuccessNote(null);
        }}
        onRefresh={handleRefresh}
      />

      {showAddForm && (
        <AddReviewForm
          onCancel={() => setShowAddForm(false)}
          onCreated={(review) => {
            dispatch(prependAdminReview(review));
            setShowAddForm(false);
            const message = `Review added for ${review.product?.name ?? "product"}.`;
            setSuccessNote(message);
            notifyActionSuccess(message);
          }}
          onError={(message) => {
            setMutationError(message);
            notifyActionError(message, "Failed to add the review.");
          }}
        />
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
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

      <ReviewsTable
        reviews={animatedReviews}
        isLoading={isLoading}
        totalCount={meta?.total ?? reviews.length}
        busyId={busyId}
        onDelete={(id) => {
          void handleDelete(id);
        }}
      />

      {meta && meta.totalPages > 1 && (
        <AdminPagination
          meta={meta}
          isLoading={isLoading}
          onPageChange={setPage}
        />
      )}
    </section>
  );
}
