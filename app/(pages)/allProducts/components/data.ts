export type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  image: string;
  images?: string[];
  rating: number;
  reviewCount: number;
  badge?: string;
  category: string;
  brand?: string;
  inStock: boolean;
};

export type SortOption =
  | "popular"
  | "price-low"
  | "price-high"
  | "rating"
  | "newest";

export type ViewMode = "grid" | "list";

export type Filters = {
  categories: string[];
  brands: string[];
  priceRange: [number, number];
  minRating: number;
  inStockOnly: boolean;
};

export const CATEGORIES = [
  "Grocery & Essentials",
  "Electronics & Gadgets",
  "Fashion & Clothing",
  "Home & Kitchen",
];

export const BRANDS = [
  "EnterFly",
  "FreshFarm",
  "TechPro",
  "UrbanWear",
  "HomeLux",
  "EcoLife",
];

export const PRICE_BOUNDS: [number, number] = [0, 5000];

export const allProductsData: Product[] = [
  // Grocery
  {
    id: "g1",
    name: "Fresh Organic Bananas",
    description: "Naturally ripened organic bananas, rich in potassium.",
    price: 69,
    discountPrice: 49,
    image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500",
    rating: 4.5,
    reviewCount: 120,
    badge: "Organic",
    category: "Grocery & Essentials",
    brand: "FreshFarm",
    inStock: true,
  },
  {
    id: "g2",
    name: "Whole Wheat Bread Loaf",
    description: "Freshly baked whole wheat bread with no preservatives.",
    price: 60,
    discountPrice: 45,
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500",
    rating: 4.2,
    reviewCount: 85,
    badge: "Fresh",
    category: "Grocery & Essentials",
    brand: "FreshFarm",
    inStock: true,
  },
  {
    id: "g3",
    name: "Farm Fresh Eggs (12 Pack)",
    description: "Free-range farm eggs packed with protein.",
    price: 110,
    discountPrice: 89,
    image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=500",
    rating: 4.7,
    reviewCount: 200,
    badge: "Bestseller",
    category: "Grocery & Essentials",
    brand: "FreshFarm",
    inStock: true,
  },
  {
    id: "g4",
    name: "Organic Milk 1L",
    description: "Pure organic milk sourced from grass-fed cows.",
    price: 80,
    discountPrice: 65,
    image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500",
    rating: 4.3,
    reviewCount: 95,
    badge: "Pure",
    category: "Grocery & Essentials",
    brand: "FreshFarm",
    inStock: true,
  },
  {
    id: "g5",
    name: "Basmati Rice 5kg Premium",
    description: "Long-grain premium basmati rice with aromatic fragrance.",
    price: 520,
    discountPrice: 399,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500",
    rating: 4.6,
    reviewCount: 310,
    badge: "New",
    category: "Grocery & Essentials",
    brand: "EnterFly",
    inStock: true,
  },

  // Electronics
  {
    id: "e1",
    name: "Wireless Bluetooth Earbuds",
    description: "Premium noise-cancelling earbuds with deep bass.",
    price: 2499,
    discountPrice: 1299,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12f8e4e12?w=500",
    rating: 4.4,
    reviewCount: 540,
    badge: "Hot Deal",
    category: "Electronics & Gadgets",
    brand: "TechPro",
    inStock: true,
  },
  {
    id: "e2",
    name: "Smart Watch Fitness Tracker",
    description: "Track steps, heart rate, sleep, and SpO2.",
    price: 3499,
    discountPrice: 1999,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
    rating: 4.3,
    reviewCount: 320,
    badge: "Trending",
    category: "Electronics & Gadgets",
    brand: "TechPro",
    inStock: true,
  },
  {
    id: "e3",
    name: "Portable Power Bank 10000mAh",
    description: "Slim and lightweight with dual USB ports.",
    price: 1299,
    discountPrice: 799,
    image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500",
    rating: 4.5,
    reviewCount: 410,
    badge: "Bestseller",
    category: "Electronics & Gadgets",
    brand: "TechPro",
    inStock: true,
  },
  {
    id: "e4",
    name: "Wireless Mouse Ergonomic",
    description: "Ergonomic design with silent clicks and adjustable DPI.",
    price: 999,
    discountPrice: 599,
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500",
    rating: 4.6,
    reviewCount: 275,
    badge: "Top Rated",
    category: "Electronics & Gadgets",
    brand: "TechPro",
    inStock: false,
  },
  {
    id: "e5",
    name: "LED Desk Lamp Touch Control",
    description: "Adjustable brightness with USB charging port.",
    price: 1499,
    discountPrice: 899,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=500",
    rating: 4.2,
    reviewCount: 150,
    badge: "New",
    category: "Electronics & Gadgets",
    brand: "HomeLux",
    inStock: true,
  },

  // Fashion
  {
    id: "f1",
    name: "Men's Cotton Casual T-Shirt",
    description: "Breathable 100% cotton t-shirt with a relaxed fit.",
    price: 699,
    discountPrice: 349,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
    rating: 4.3,
    reviewCount: 230,
    badge: "50% Off",
    category: "Fashion & Clothing",
    brand: "UrbanWear",
    inStock: true,
  },
  {
    id: "f2",
    name: "Women's Summer Floral Dress",
    description: "Lightweight floral print dress for summer outings.",
    price: 1499,
    discountPrice: 799,
    image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500",
    rating: 4.5,
    reviewCount: 180,
    badge: "Trending",
    category: "Fashion & Clothing",
    brand: "UrbanWear",
    inStock: true,
  },
  {
    id: "f3",
    name: "Unisex Running Sneakers",
    description: "Lightweight running shoes with cushioned sole.",
    price: 2199,
    discountPrice: 1299,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
    rating: 4.7,
    reviewCount: 450,
    badge: "Top Rated",
    category: "Fashion & Clothing",
    brand: "UrbanWear",
    inStock: true,
  },
  {
    id: "f4",
    name: "Stylish Sunglasses UV Protection",
    description: "Polarized UV400 sunglasses with a lightweight frame.",
    price: 1199,
    discountPrice: 599,
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500",
    rating: 4.6,
    reviewCount: 290,
    badge: "Bestseller",
    category: "Fashion & Clothing",
    brand: "UrbanWear",
    inStock: true,
  },

  // Home & Kitchen
  {
    id: "h1",
    name: "Non-Stick Frying Pan Set",
    description: "Premium non-stick cookware with heat-resistant handles.",
    price: 1299,
    discountPrice: 699,
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500",
    rating: 4.5,
    reviewCount: 340,
    badge: "Hot Deal",
    category: "Home & Kitchen",
    brand: "HomeLux",
    inStock: true,
  },
  {
    id: "h2",
    name: "Stainless Steel Water Bottle",
    description: "Double-wall insulated bottle. BPA-free and eco-friendly.",
    price: 699,
    discountPrice: 399,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500",
    rating: 4.3,
    reviewCount: 210,
    badge: "Eco-Friendly",
    category: "Home & Kitchen",
    brand: "EcoLife",
    inStock: true,
  },
  {
    id: "h3",
    name: "Cotton Bedsheet King Size",
    description: "Soft 300 thread count cotton bedsheet with 2 pillow covers.",
    price: 1599,
    discountPrice: 899,
    image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=500",
    rating: 4.4,
    reviewCount: 175,
    badge: "Premium",
    category: "Home & Kitchen",
    brand: "HomeLux",
    inStock: true,
  },
  {
    id: "h4",
    name: "Scented Candle Gift Set",
    description: "Set of 4 soy wax candles with calming fragrances.",
    price: 599,
    discountPrice: 349,
    image: "https://images.unsplash.com/photo-1602607688066-d694778ba902?w=500",
    rating: 4.6,
    reviewCount: 420,
    badge: "Gift Pick",
    category: "Home & Kitchen",
    brand: "HomeLux",
    inStock: true,
  },
  {
    id: "h5",
    name: "Indoor Plant Pot Decorative",
    description: "Modern minimalist ceramic pot with drainage hole.",
    price: 499,
    discountPrice: 299,
    image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500",
    rating: 4.7,
    reviewCount: 160,
    badge: "New",
    category: "Home & Kitchen",
    brand: "EcoLife",
    inStock: false,
  },
];
