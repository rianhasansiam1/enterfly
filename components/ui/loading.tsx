import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type LoadingSize = "xs" | "sm" | "md" | "lg";

const spinnerSizes: Record<LoadingSize, string> = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-7 w-7",
};

type LoadingSpinnerProps = {
  size?: LoadingSize;
  label?: string;
  showLabel?: boolean;
  className?: string;
  iconClassName?: string;
  labelClassName?: string;
};

export function LoadingSpinner({
  size = "sm",
  label = "Loading",
  showLabel = false,
  className,
  iconClassName,
  labelClassName,
}: LoadingSpinnerProps) {
  return (
    <span
      role={showLabel ? "status" : undefined}
      aria-live={showLabel ? "polite" : undefined}
      className={cn("inline-flex items-center justify-center gap-2", className)}
    >
      <Loader2
        aria-hidden="true"
        className={cn("animate-spin", spinnerSizes[size], iconClassName)}
      />
      {showLabel ? (
        <span className={labelClassName}>{label}</span>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </span>
  );
}

export function ButtonLoader({
  label,
  size = "sm",
  className,
}: {
  label: string;
  size?: LoadingSize;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center justify-center gap-2", className)}>
      <LoadingSpinner size={size} label={label} />
      <span>{label}</span>
    </span>
  );
}

type LoadingButtonProps = React.ComponentProps<"button"> & {
  isLoading?: boolean;
  loadingText?: string;
  spinnerSize?: LoadingSize;
};

export function LoadingButton({
  isLoading = false,
  loadingText = "Loading...",
  spinnerSize = "sm",
  disabled,
  children,
  ...props
}: LoadingButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
    >
      {isLoading ? (
        <ButtonLoader label={loadingText} size={spinnerSize} />
      ) : (
        children
      )}
    </button>
  );
}

export function FormSubmitLoader({
  text = "Submitting...",
  className,
}: {
  text?: string;
  className?: string;
}) {
  return (
    <p
      role="status"
      aria-live="polite"
      className={cn("inline-flex items-center gap-2 text-xs font-medium text-violet-700", className)}
    >
      <LoadingSpinner size="xs" label={text} />
      {text}
    </p>
  );
}

export function SkeletonBlock({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-lg bg-gray-200/80", className)}
      {...props}
    />
  );
}

export function CardSkeleton({
  className,
  media = true,
  lines = 3,
}: {
  className?: string;
  media?: boolean;
  lines?: number;
}) {
  return (
    <div className={cn("rounded-2xl border border-violet-100 bg-white p-4 shadow-sm", className)}>
      {media && <SkeletonBlock className="mb-4 aspect-4/3 w-full rounded-xl" />}
      <div className="space-y-2">
        {Array.from({ length: lines }, (_, index) => (
          <SkeletonBlock
            key={index}
            className={cn(
              "h-3",
              index === 0 ? "w-4/5" : index === lines - 1 ? "w-2/5" : "w-full",
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm", className)}>
      <SkeletonBlock className="aspect-4/3 w-full rounded-none" />
      <div className="space-y-2 p-2.5">
        <div className="flex gap-1">
          {Array.from({ length: 5 }, (_, index) => (
            <SkeletonBlock key={index} className="h-3 w-3 rounded-full" />
          ))}
        </div>
        <SkeletonBlock className="h-3 w-5/6" />
        <div className="flex items-center gap-2">
          <SkeletonBlock className="h-4 w-20" />
          <SkeletonBlock className="h-3 w-14" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({
  count = 8,
  wide = false,
  className,
}: {
  count?: number;
  wide?: boolean;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-label="Loading products"
      aria-busy="true"
      className={cn(
        `grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-3 ${
          wide ? "lg:grid-cols-4 xl:grid-cols-5" : "lg:grid-cols-3 xl:grid-cols-4"
        }`,
        className,
      )}
    >
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function TableSkeleton({
  rows = 6,
  columns = 5,
  className,
  caption = "Loading table",
}: {
  rows?: number;
  columns?: number;
  className?: string;
  caption?: string;
}) {
  return (
    <div
      role="status"
      aria-label={caption}
      aria-busy="true"
      className={cn("overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm", className)}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-violet-50">
            <tr>
              {Array.from({ length: columns }, (_, index) => (
                <th key={index} className="px-4 py-3">
                  <SkeletonBlock className="h-3 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, rowIndex) => (
              <tr key={rowIndex} className="border-t border-violet-100/70">
                {Array.from({ length: columns }, (_, columnIndex) => (
                  <td key={columnIndex} className="px-4 py-3">
                    <SkeletonBlock
                      className={cn(
                        "h-4",
                        columnIndex === 0 ? "w-40" : columnIndex === columns - 1 ? "w-24" : "w-28",
                      )}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <span className="sr-only">{caption}</span>
    </div>
  );
}

export function SectionLoader({
  label = "Loading section...",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={cn(
        "rounded-2xl border border-violet-100 bg-white p-6 text-center text-sm font-medium text-violet-700 shadow-sm",
        className,
      )}
    >
      <LoadingSpinner label={label} showLabel />
    </div>
  );
}

export function PageLoader({
  label = "Loading page...",
  children,
  className,
}: {
  label?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <main
      aria-busy="true"
      className={cn("min-h-screen bg-linear-to-b from-violet-50/60 via-white to-white", className)}
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {children ?? <SectionLoader label={label} />}
      </div>
    </main>
  );
}

export function FullPageLoader({ label = "Loading..." }: { label?: string }) {
  return <LoadingScreen label={label} />;
}

export function LoadingScreen({
  label = "Loading EnterFly...",
  fixed = false,
  className,
}: {
  label?: string;
  fixed?: boolean;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={cn(
        "grid place-items-center bg-linear-to-b from-violet-50 via-white to-fuchsia-50/60 px-4",
        fixed ? "fixed inset-0 z-9998" : "min-h-screen",
        className,
      )}
    >
      <div className="w-full max-w-sm text-center">
        <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-violet-600 via-indigo-600 to-fuchsia-600 text-xl font-black text-white shadow-xl shadow-violet-200/70">
          EF
          <span
            aria-hidden="true"
            className="absolute -inset-1 rounded-2xl border border-violet-300/70"
          />
        </div>

        <p className="mt-5 text-lg font-extrabold text-gray-950">EnterFly</p>
        <p className="mt-1 text-sm font-medium text-violet-700">{label}</p>

        <div className="mx-auto mt-6 h-1.5 w-48 overflow-hidden rounded-full bg-violet-100">
          <div className="h-full w-2/5 animate-pulse rounded-full bg-linear-to-r from-violet-600 via-indigo-600 to-fuchsia-600" />
        </div>

        <span className="sr-only">{label}</span>
      </div>
    </div>
  );
}

export function ProductListingPageLoader() {
  return (
    <PageLoader>
      <div className="flex gap-5">
        <aside className="hidden w-64 shrink-0 space-y-4 lg:block">
          <CardSkeleton media={false} lines={6} />
          <CardSkeleton media={false} lines={4} />
        </aside>
        <section className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
            <SkeletonBlock className="h-5 w-48" />
            <div className="flex gap-2">
              <SkeletonBlock className="h-9 w-24 rounded-xl" />
              <SkeletonBlock className="h-9 w-24 rounded-xl" />
            </div>
          </div>
          <ProductGridSkeleton count={10} wide />
        </section>
      </div>
    </PageLoader>
  );
}

export function ProductDetailPageLoader() {
  return (
    <PageLoader>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="space-y-4">
          <SkeletonBlock className="aspect-square w-full rounded-3xl" />
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }, (_, index) => (
              <SkeletonBlock key={index} className="aspect-square rounded-2xl" />
            ))}
          </div>
        </section>
        <section className="space-y-4">
          <SkeletonBlock className="h-4 w-32" />
          <SkeletonBlock className="h-9 w-5/6" />
          <SkeletonBlock className="h-5 w-44" />
          <CardSkeleton media={false} lines={5} />
          <div className="grid grid-cols-2 gap-3">
            <SkeletonBlock className="h-12 rounded-2xl" />
            <SkeletonBlock className="h-12 rounded-2xl" />
          </div>
        </section>
      </div>
    </PageLoader>
  );
}

export function CartPageLoader() {
  return (
    <PageLoader>
      <SkeletonBlock className="h-9 w-56" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-3">
          {Array.from({ length: 3 }, (_, index) => (
            <CardSkeleton key={index} className="min-h-32" lines={4} />
          ))}
        </section>
        <CardSkeleton className="h-96" media={false} lines={8} />
      </div>
    </PageLoader>
  );
}

export function CheckoutPageLoader() {
  return (
    <PageLoader>
      <SkeletonBlock className="h-9 w-64" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <section className="space-y-5">
          <CardSkeleton media={false} lines={8} />
          <CardSkeleton media={false} lines={4} />
          <CardSkeleton media={false} lines={5} />
        </section>
        <CardSkeleton className="h-96" media={false} lines={8} />
      </div>
    </PageLoader>
  );
}

export function ProfilePageLoader() {
  return (
    <PageLoader>
      <CardSkeleton media={false} lines={4} />
      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <CardSkeleton media={false} lines={6} />
        <CardSkeleton media={false} lines={9} />
      </div>
    </PageLoader>
  );
}

export function AdminPageLoader() {
  return (
    <section aria-busy="true" className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <CardSkeleton key={index} media={false} lines={3} />
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
        <SkeletonBlock className="h-5 w-48" />
        <div className="flex gap-2">
          <SkeletonBlock className="h-9 w-24 rounded-xl" />
          <SkeletonBlock className="h-9 w-24 rounded-xl" />
        </div>
      </div>
      <TableSkeleton rows={7} columns={7} caption="Loading admin table" />
    </section>
  );
}
