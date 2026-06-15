"use client";

import { Search, X, Loader2, PackageSearch } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { searchProductsFromApi, type Product } from "@/features/products/api";

/** Debounce window (ms) before a keystroke triggers a network search. */
const SEARCH_DEBOUNCE_MS = 300;
/** Max products shown inside the dropdown preview. */
const RESULTS_LIMIT = 6;

type SearchBarProps = {
  /** Extra classes for the outer wrapper (controls width/layout per slot). */
  className?: string;
  /** Tailwind classes applied to the text input. */
  inputClassName?: string;
  placeholder?: string;
  /** Focus the input when an enclosing search panel becomes visible. */
  shouldFocus?: boolean;
  /** Fired after the user navigates (e.g. close the mobile menu sheet). */
  onNavigate?: () => void;
};

/**
 * Navbar search with a live results dropdown.
 *
 * Typing debounces a request to `GET /api/products?search=` and renders a
 * small preview of matching products. Selecting a result opens its detail
 * page; pressing Enter (or "View all results") routes to the full
 * `/products` listing with the query pre-filled.
 */
export default function SearchBar({
  className,
  inputClassName,
  placeholder = "Search products, stores, categories...",
  shouldFocus = false,
  onNavigate,
}: SearchBarProps) {
  const router = useRouter();
  const listboxId = useId();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const trimmed = query.trim();

  useEffect(() => {
    if (!shouldFocus) return;

    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [shouldFocus]);

  // Debounced live search. Each run aborts the previous in-flight request
  // so only the latest keystroke's results land in state. All state writes
  // happen inside the (async) timer callback, never synchronously in the
  // effect body, to avoid cascading renders.
  useEffect(() => {
    if (trimmed.length === 0) {
      const reset = setTimeout(() => {
        setResults([]);
        setError(null);
        setIsLoading(false);
      }, 0);
      return () => clearTimeout(reset);
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const items = await searchProductsFromApi(trimmed, {
          limit: RESULTS_LIMIT,
          signal: controller.signal,
        });
        setResults(items);
        setActiveIndex(-1);
        setError(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        setResults([]);
        setError(
          err instanceof Error ? err.message : "Failed to search products.",
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [trimmed]);

  // Close the dropdown on outside click.
  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const closeDropdown = () => {
    setOpen(false);
    setActiveIndex(-1);
  };

  const goToProduct = (slug: string) => {
    closeDropdown();
    onNavigate?.();
    router.push(`/products/${slug}`);
  };

  const goToAllResults = () => {
    if (trimmed.length === 0) return;
    closeDropdown();
    onNavigate?.();
    router.push(`/products?search=${encodeURIComponent(trimmed)}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (results.length === 0) return;
      setOpen(true);
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (results.length === 0) return;
      setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) {
        goToProduct(results[activeIndex].slug);
      } else {
        goToAllResults();
      }
    } else if (event.key === "Escape") {
      closeDropdown();
    }
  };

  const showDropdown = open && trimmed.length > 0;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative w-full">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
        <Input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-autocomplete="list"
          value={query}
          onChange={(e) => {
            const next = e.target.value;
            setQuery(next);
            setOpen(true);
            setIsLoading(next.trim().length > 0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "h-10 rounded-xl border-violet-500/40 bg-white/60 pl-11 pr-9 text-sm text-gray-800 focus-visible:bg-white focus-visible:border-violet-500 focus-visible:ring-violet-200",
            inputClassName,
          )}
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              setResults([]);
              setOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 transition-colors duration-200 hover:bg-white/70"
          >
            <X className="h-4 w-4 text-gray-600" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-violet-100 bg-white shadow-xl"
        >
          {isLoading && (
            <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-violet-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Searching...</span>
            </div>
          )}

          {!isLoading && error && (
            <div className="px-4 py-5 text-sm text-red-600">{error}</div>
          )}

          {!isLoading && !error && results.length === 0 && (
            <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
              <PackageSearch className="h-6 w-6 text-violet-400" />
              <p className="text-sm text-gray-600">
                No products found for{" "}
                <span className="font-semibold text-gray-800">
                  &ldquo;{trimmed}&rdquo;
                </span>
              </p>
            </div>
          )}

          {!isLoading && !error && results.length > 0 && (
            <>
              <ul className="max-h-[60vh] overflow-y-auto py-1">
                {results.map((product, index) => {
                  const finalPrice = product.discountPrice ?? product.price;
                  const hasDiscount =
                    product.discountPrice != null &&
                    product.discountPrice < product.price;

                  return (
                    <li key={product.id} role="option" aria-selected={index === activeIndex}>
                      <button
                        type="button"
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => goToProduct(product.slug)}
                        className={cn(
                          "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors",
                          index === activeIndex
                            ? "bg-violet-50"
                            : "hover:bg-violet-50/60",
                        )}
                      >
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-sm font-medium text-gray-800">
                            {product.name}
                          </p>
                          <p className="line-clamp-1 text-xs text-gray-500">
                            {product.category}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-bold text-violet-700">
                            BDT {finalPrice.toLocaleString()}
                          </p>
                          {hasDiscount && (
                            <p className="text-[11px] text-gray-400 line-through">
                              BDT {product.price.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <button
                type="button"
                onClick={goToAllResults}
                className="flex w-full items-center justify-center gap-1.5 border-t border-gray-100 bg-violet-50/40 px-4 py-2.5 text-sm font-semibold text-violet-700 transition-colors hover:bg-violet-50"
              >
                <Search className="h-4 w-4" />
                View all results for &ldquo;{trimmed}&rdquo;
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
