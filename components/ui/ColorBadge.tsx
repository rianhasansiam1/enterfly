import { cn } from "@/lib/utils";

/**
 * ColorBadge
 * ----------
 * Renders a product variant's color + size for customer-facing surfaces
 * (cart, checkout, order summary, profile).
 *
 * The admin now picks variant colors with a hex color picker, so `color`
 * may be a hex string (e.g. "#1e3a8a"). When it is, we paint a small swatch
 * instead of printing the raw hex. Legacy rows that stored a color *name*
 * ("Black") keep rendering as text. `size` is always shown as text.
 */

const HEX_VALUE = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

export function isHexColor(value: string | null | undefined): boolean {
  return typeof value === "string" && HEX_VALUE.test(value.trim());
}

export default function ColorBadge({
  color,
  size,
  className,
}: {
  color?: string | null;
  size?: string | null;
  className?: string;
}) {
  const hasColor = Boolean(color && color.trim());
  const hasSize = Boolean(size && size.trim());
  if (!hasColor && !hasSize) return null;

  const colorIsHex = isHexColor(color);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] font-medium text-violet-600",
        className,
      )}
    >
      {hasColor &&
        (colorIsHex ? (
          <span
            className="inline-block h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-inset ring-black/15"
            style={{ backgroundColor: color as string }}
            title={color as string}
            aria-label={`Color ${color}`}
          />
        ) : (
          <span>{color}</span>
        ))}
      {hasColor && hasSize && <span className="text-gray-300">/</span>}
      {hasSize && <span>{size}</span>}
    </span>
  );
}
