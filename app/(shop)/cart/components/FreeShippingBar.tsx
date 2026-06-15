import { Truck, PartyPopper } from "lucide-react";

type FreeShippingBarProps = {
  subtotal: number;
  threshold: number;
};

export default function FreeShippingBar({
  subtotal,
  threshold,
}: FreeShippingBarProps) {
  const remaining = Math.max(0, threshold - subtotal);
  const progress = Math.min(100, (subtotal / threshold) * 100);
  const reached = remaining === 0;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border px-4 py-3.5 transition-colors duration-300 ${
        reached
          ? "border-emerald-200 bg-emerald-50"
          : "border-violet-100 bg-white"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white ${
            reached
              ? "bg-linear-to-br from-emerald-500 to-teal-600"
              : "bg-linear-to-br from-violet-500 to-indigo-600"
          }`}
        >
          {reached ? (
            <PartyPopper className="h-4 w-4" />
          ) : (
            <Truck className="h-4 w-4" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          {reached ? (
            <p className="text-sm font-semibold text-emerald-800">
              You&apos;ve unlocked free shipping
            </p>
          ) : (
            <p className="text-sm font-semibold text-gray-800">
              Add{" "}
              <span className="text-violet-700">
                BDT {remaining.toLocaleString()}
              </span>{" "}
              more for free shipping
            </p>
          )}
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                reached
                  ? "bg-linear-to-r from-emerald-400 to-teal-500"
                  : "bg-linear-to-r from-violet-500 via-fuchsia-500 to-indigo-500"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
