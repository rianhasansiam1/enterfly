"use client";

export default function BackgroundFX() {
  return (
    <>
      {/* Soft lavender wash matches Navbar/TopBanner backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(135deg, #faf5ff 0%, #ede9fe 35%, #e0e7ff 70%, #faf5ff 100%)",
          backgroundSize: "200% 200%",
          animation: "meshShift 18s ease-in-out infinite",
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute left-[10%] top-[15%] z-0 h-72 w-72 rounded-full bg-violet-300/40 blur-3xl"
        style={{ animation: "drift 14s ease-in-out infinite" }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[12%] right-[8%] z-0 h-80 w-80 rounded-full bg-indigo-300/40 blur-3xl"
        style={{ animation: "drift 18s ease-in-out infinite reverse" }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute right-[40%] top-[40%] z-0 h-56 w-56 rounded-full bg-purple-300/30 blur-3xl"
        style={{ animation: "drift 22s ease-in-out infinite" }}
      />

      {/* Subtle grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #6d28d9 1px, transparent 1px), linear-gradient(to bottom, #6d28d9 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage:
            "radial-gradient(ellipse at center, black 50%, transparent 80%)",
        }}
      />
    </>
  );
}
