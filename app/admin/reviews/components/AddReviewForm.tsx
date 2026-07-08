"use client";

import { useEffect, useState } from "react";

import { createAdminReview } from "@/features/admin-reviews/api";
import {
  fetchAllActiveProductsFromApi,
  type Product,
} from "@/features/products/api";
import { ButtonLoader } from "@/components/ui/loading";

export default function AddReviewForm({
  onCancel,
  onCreated,
  onError,
}: {
  onCancel: () => void;
  onCreated: (review: Awaited<ReturnType<typeof createAdminReview>>) => void;
  onError: (message: string) => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productId, setProductId] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let ignore = false;
    void (async () => {
      try {
        const items = await fetchAllActiveProductsFromApi();
        if (!ignore) setProducts(items);
      } catch (loadError) {
        if (!ignore) {
          onError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load products.",
          );
        }
      } finally {
        if (!ignore) setProductsLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [onError]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!productId) {
      onError("Please choose a product.");
      return;
    }
    if (authorName.trim().length < 2) {
      onError("Please enter an author name.");
      return;
    }

    setSubmitting(true);
    try {
      const review = await createAdminReview({
        productId,
        authorName: authorName.trim(),
        rating,
        title: title.trim() || undefined,
        comment: comment.trim() || undefined,
      });
      onCreated(review);
    } catch (mutation) {
      onError(
        mutation instanceof Error
          ? mutation.message
          : "Failed to add the review.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      aria-busy={submitting || undefined}
      className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm sm:p-5"
    >
      <h2 className="text-sm font-bold text-gray-900">Add a review</h2>
      <p className="mt-0.5 text-xs text-gray-500">
        Seed a review on a product. These are tagged as admin-added.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
          Product
          <select
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            disabled={productsLoading}
            className="h-10 rounded-xl border border-violet-200 px-3 text-sm font-normal text-gray-900 outline-none transition focus:border-violet-500 disabled:opacity-60"
          >
            <option value="">
              {productsLoading ? "Loading products..." : "Select a product"}
            </option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.productCode ? `${product.productCode} — ` : ""}
                {product.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
          Author name
          <input
            type="text"
            value={authorName}
            onChange={(event) => setAuthorName(event.target.value)}
            placeholder="e.g. Rahim Uddin"
            className="h-10 rounded-xl border border-violet-200 px-3 text-sm font-normal text-gray-900 outline-none transition focus:border-violet-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
          Rating
          <select
            value={String(rating)}
            onChange={(event) => setRating(Number(event.target.value))}
            className="h-10 rounded-xl border border-violet-200 px-3 text-sm font-normal text-gray-900 outline-none transition focus:border-violet-500"
          >
            {[5, 4, 3, 2, 1].map((star) => (
              <option key={star} value={star}>
                {star} star{star === 1 ? "" : "s"}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
          Title (optional)
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Short summary"
            className="h-10 rounded-xl border border-violet-200 px-3 text-sm font-normal text-gray-900 outline-none transition focus:border-violet-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700 sm:col-span-2">
          Comment (optional)
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="What did the customer say?"
            rows={3}
            className="rounded-xl border border-violet-200 px-3 py-2 text-sm font-normal text-gray-900 outline-none transition focus:border-violet-500"
          />
        </label>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-10 items-center rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting || undefined}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:from-violet-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? <ButtonLoader label="Adding..." /> : "Add review"}
        </button>
      </div>
    </form>
  );
}
