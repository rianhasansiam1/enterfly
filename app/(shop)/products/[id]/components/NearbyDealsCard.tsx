/**
 * Decorative "Find deals near you" promo with an inline-SVG map.
 *
 * The desktop and mobile placements differ only by sizing; props pick
 * a preset so the page can render either without copy-pasting the SVG.
 */
type NearbyDealsCardProps = {
  size?: "lg" | "sm";
};

export default function NearbyDealsCard({ size = "lg" }: NearbyDealsCardProps) {
  const isLg = size === "lg";
  const mapWrapper = isLg ? "w-40 h-32" : "w-36 h-28";
  const heading = isLg
    ? "text-lg font-semibold text-gray-800 text-center leading-snug"
    : "text-base font-semibold text-gray-800 text-center leading-snug";
  const button = isLg
    ? "bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-5 py-2 rounded-full transition-colors shadow-sm"
    : "bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium px-4 py-1.5 rounded-full transition-colors shadow-sm";
  const contentWrapper = isLg
    ? "flex-1 bg-violet-50 rounded-2xl border-2 border-violet-200 flex flex-col justify-center items-center p-4 gap-3"
    : "flex-1 bg-violet-50 rounded-2xl border-2 border-violet-200 flex flex-col justify-center items-center p-3 gap-2";
  const pinSvg = isLg
    ? "w-8 h-10 drop-shadow-lg"
    : "w-7 h-9 drop-shadow-lg";
  const badge = isLg
    ? "absolute top-2 left-2 bg-violet-600 text-white text-[8px] px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-sm"
    : "absolute top-1.5 left-1.5 bg-violet-600 text-white text-[7px] px-1 py-0.5 rounded flex items-center gap-0.5 shadow-sm";
  const badgeArrow = isLg ? "w-2.5 h-2.5" : "w-2 h-2";

  return (
    <div className="flex gap-3">
      <div
        className={`relative ${mapWrapper} shrink-0 rounded-2xl overflow-hidden border-2 border-violet-200`}
      >
        <div className="absolute inset-0 bg-[#f5f0e8]">
          <svg
            viewBox="0 0 200 150"
            className="w-full h-full"
            preserveAspectRatio="xMidYMid slice"
          >
            <rect width="200" height="150" fill="#f0ebe3" />

            <ellipse cx="30" cy="25" rx="25" ry="20" fill="#c7e6c7" />
            <ellipse cx="170" cy="120" rx="30" ry="25" fill="#c7e6c7" />
            <ellipse cx="45" cy="130" rx="20" ry="15" fill="#d4edd4" />

            <path
              d="M0 60 Q40 50, 60 70 Q80 90, 100 75 Q130 55, 160 80 Q180 95, 200 85"
              stroke="#a8d4e6"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M0 60 Q40 50, 60 70 Q80 90, 100 75 Q130 55, 160 80 Q180 95, 200 85"
              stroke="#8ec5db"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
            />

            <path
              d="M0 100 L80 100 Q100 100, 100 80 L100 0"
              stroke="#f5d96a"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M0 100 L80 100 Q100 100, 100 80 L100 0"
              stroke="#fae89a"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />

            <path
              d="M50 150 L50 110 Q50 100, 60 100"
              stroke="#f5d96a"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M140 0 L140 40 Q140 50, 150 50 L200 50"
              stroke="#e8e8e8"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M0 30 L60 30"
              stroke="#e8e8e8"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />

            <path d="M120 100 L120 150" stroke="#e8e8e8" strokeWidth="3" fill="none" />
            <path d="M160 70 L160 150" stroke="#e8e8e8" strokeWidth="3" fill="none" />
            <path d="M100 120 L200 120" stroke="#e8e8e8" strokeWidth="3" fill="none" />
          </svg>
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <svg className={pinSvg} viewBox="0 0 24 32">
            <path
              d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20c0-6.6-5.4-12-12-12z"
              fill="#ef4444"
            />
            <circle cx="12" cy="12" r="4" fill="#fecaca" />
          </svg>
        </div>

        <div className={badge}>
          <span className="font-medium">Navigation Concept</span>
          <svg
            className={badgeArrow}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>

      <div className={contentWrapper}>
        <h3 className={heading}>
          Find other best
          <br />
          deals near 10 km
        </h3>
        <button type="button" className={button}>
          Go to deals
        </button>
      </div>
    </div>
  );
}
