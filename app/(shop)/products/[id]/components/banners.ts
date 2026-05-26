/**
 * Static deals/promo banners for the product-details page.
 *
 * Hard-coded for now; swap to a `Banner` Prisma model + service call
 * when the marketing team needs to manage these from the admin panel.
 */

export type DealBanner = {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  bgClass: string;
  link: string;
};

export type PromoBanner = {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  discount: string;
  bgClass: string;
  link: string;
};

export const DEAL_BANNERS: DealBanner[] = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600",
    title: "Up to 70% Off",
    subtitle: "Black Friday",
    bgClass: "bg-rose-500",
    link: "/products?sale=black-friday",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=600",
    title: "Mega Sale",
    subtitle: "Electronics",
    bgClass: "bg-violet-600",
    link: "/products?category=electronics",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1607083206325-caf1edba7a83?w=600",
    title: "Flat 50% Off",
    subtitle: "Fashion Week",
    bgClass: "bg-amber-500",
    link: "/products?category=fashion",
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1607083207685-aaf05f2c908c?w=600",
    title: "Buy 1 Get 1",
    subtitle: "Home Essentials",
    bgClass: "bg-emerald-600",
    link: "/products?category=home",
  },
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=600",
    title: "New Arrivals",
    subtitle: "This Week",
    bgClass: "bg-indigo-600",
    link: "/products?sort=newest",
  },
];

export const PROMO_BANNERS: PromoBanner[] = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=800",
    title: "Mega Sale",
    subtitle: "Save Big Today",
    discount: "UP TO 60% OFF",
    bgClass: "bg-violet-700",
    link: "/products?sale=mega",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800",
    title: "Holiday Deals",
    subtitle: "Limited Time",
    discount: "EXTRA 20%",
    bgClass: "bg-rose-600",
    link: "/products?sale=holiday",
  },
];
