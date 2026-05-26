// =============================================================================
// Demo Store - Product Details Data Source
//
// Provides demo data and lookup helpers for the product details page.
// Replace with real data fetching (DB / API) when ready.
// =============================================================================

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type ProductSpec = {
  id: string
  icon: string
  label: string
  value: string
}

export type IconName =
  | 'Battery'
  | 'Bluetooth'
  | 'Headphones'
  | 'Mic'
  | 'Armchair'
  | 'Lightbulb'
  | 'SlidersHorizontal'
  | 'Monitor'
  | 'Cpu'
  | 'Camera'
  | 'HardDrive'
  | 'Smartphone'
  | 'Keyboard'
  | 'Usb'
  | 'Square'
  | 'Settings'

export type DealBanner = {
  id: number
  image: string
  title: string
  subtitle: string
  bgClass: string
  link: string
}

export type PromoBanner = {
  id: number
  image: string
  title: string
  subtitle: string
  discount: string
  bgClass: string
  link: string
}

export interface ProductPricing {
  price: number
  originalPrice: number
  discount: number
}

export interface ProductStock {
  inStock: boolean
  stockCount: number
}

export interface ProductDetails {
  id: number
  name: string
  description: string
  brand: string
  category: string
  image: string
  images: string[]
  pricing: ProductPricing
  specs: ProductSpec[]
  stock: ProductStock
  deliveryTime: string
  rating: number
  reviewCount: number
}

export interface ProductCard {
  id: number
  name: string
  image: string
  price: number
  originalPrice: number
  discount: number
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const buildSpec = (
  id: string,
  icon: IconName,
  label: string,
  value: string,
): ProductSpec => ({ id, icon, label, value })

// -----------------------------------------------------------------------------
// Demo Products
// -----------------------------------------------------------------------------

export const products: ProductDetails[] = [
  {
    id: 1,
    name: 'Wireless Bluetooth Earbuds Pro',
    description:
      'Premium noise-cancelling earbuds with deep bass, 30-hour battery life, and crystal clear voice calls. Designed for everyday comfort and audiophile-grade sound.',
    brand: 'TechPro',
    category: 'Electronics',
    image:
      'https://images.unsplash.com/photo-1590658268037-6bf12f8e4e12?w=600',
    images: [
      'https://images.unsplash.com/photo-1590658268037-6bf12f8e4e12?w=800',
      'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=800',
      'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800',
      'https://images.unsplash.com/photo-1608156639585-b3a032ef9689?w=800',
    ],
    pricing: { price: 1299, originalPrice: 2499, discount: 48 },
    specs: [
      buildSpec('s1', 'Battery', 'Battery Life', 'Up to 30 hours with case'),
      buildSpec('s2', 'Bluetooth', 'Connectivity', 'Bluetooth 5.3'),
      buildSpec('s3', 'Headphones', 'Drivers', '11mm dynamic'),
      buildSpec('s4', 'Mic', 'Microphone', 'Dual ENC noise cancellation'),
    ],
    stock: { inStock: true, stockCount: 24 },
    deliveryTime: '2 Hours',
    rating: 4.5,
    reviewCount: 540,
  },
  {
    id: 2,
    name: 'Smart Watch Fitness Tracker',
    description:
      'Track steps, heart rate, sleep, and SpO2 with a vibrant AMOLED display. Water resistant up to 50m and 14-day battery life.',
    brand: 'TechPro',
    category: 'Electronics',
    image:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
      'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800',
      'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800',
    ],
    pricing: { price: 1999, originalPrice: 3499, discount: 43 },
    specs: [
      buildSpec('s1', 'Battery', 'Battery Life', 'Up to 14 days'),
      buildSpec('s2', 'Bluetooth', 'Connectivity', 'Bluetooth 5.2'),
      buildSpec('s3', 'Monitor', 'Display', '1.43" AMOLED'),
      buildSpec('s4', 'Settings', 'Sensors', 'HR, SpO2, Accelerometer'),
    ],
    stock: { inStock: true, stockCount: 18 },
    deliveryTime: '2 Hours',
    rating: 4.3,
    reviewCount: 320,
  },
  {
    id: 3,
    name: 'Portable Power Bank 10000mAh',
    description:
      'Slim and lightweight with dual USB ports and PD fast charging. Charge two devices simultaneously on the go.',
    brand: 'TechPro',
    category: 'Electronics',
    image:
      'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600',
    images: [
      'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800',
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800',
    ],
    pricing: { price: 799, originalPrice: 1299, discount: 38 },
    specs: [
      buildSpec('s1', 'Battery', 'Capacity', '10000 mAh'),
      buildSpec('s2', 'Usb', 'Output', '2x USB-A + 1x USB-C PD'),
      buildSpec('s3', 'Settings', 'Fast Charge', '22.5W'),
    ],
    stock: { inStock: true, stockCount: 50 },
    deliveryTime: '2 Hours',
    rating: 4.5,
    reviewCount: 410,
  },
  {
    id: 4,
    name: 'Wireless Mouse Ergonomic',
    description:
      'Ergonomic design with silent clicks and adjustable DPI. Up to 18 months on a single AA battery.',
    brand: 'TechPro',
    category: 'Electronics',
    image:
      'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600',
    images: [
      'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800',
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800',
    ],
    pricing: { price: 599, originalPrice: 999, discount: 40 },
    specs: [
      buildSpec('s1', 'Bluetooth', 'Connectivity', '2.4GHz wireless'),
      buildSpec('s2', 'Settings', 'DPI', '800 / 1200 / 1600'),
      buildSpec('s3', 'Battery', 'Battery', '18 months (1x AA)'),
    ],
    stock: { inStock: false, stockCount: 0 },
    deliveryTime: '1 Day',
    rating: 4.6,
    reviewCount: 275,
  },
  {
    id: 5,
    name: 'LED Desk Lamp Touch Control',
    description:
      'Adjustable brightness with USB charging port and eye-care flicker-free lighting. Three color temperatures.',
    brand: 'HomeLux',
    category: 'Home',
    image:
      'https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=600',
    images: [
      'https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=800',
      'https://images.unsplash.com/photo-1565374395542-0ce18882c857?w=800',
    ],
    pricing: { price: 899, originalPrice: 1499, discount: 40 },
    specs: [
      buildSpec('s1', 'Lightbulb', 'Light Source', 'LED, eye-care'),
      buildSpec('s2', 'SlidersHorizontal', 'Brightness', '5 levels'),
      buildSpec('s3', 'Usb', 'Extras', 'USB charging port'),
    ],
    stock: { inStock: true, stockCount: 12 },
    deliveryTime: '2 Hours',
    rating: 4.2,
    reviewCount: 150,
  },
  {
    id: 6,
    name: 'Mechanical Gaming Keyboard',
    description:
      'RGB backlit mechanical keyboard with hot-swappable blue switches and full N-key rollover for competitive gaming.',
    brand: 'TechPro',
    category: 'Electronics',
    image:
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600',
    images: [
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800',
      'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=800',
    ],
    pricing: { price: 2499, originalPrice: 3999, discount: 38 },
    specs: [
      buildSpec('s1', 'Keyboard', 'Switches', 'Blue mechanical, hot-swap'),
      buildSpec('s2', 'Lightbulb', 'Backlight', 'Per-key RGB'),
      buildSpec('s3', 'Usb', 'Connection', 'USB-C detachable'),
    ],
    stock: { inStock: true, stockCount: 8 },
    deliveryTime: '4 Hours',
    rating: 4.7,
    reviewCount: 612,
  },
  {
    id: 7,
    name: '4K Action Camera Waterproof',
    description:
      '4K30 action camera with electronic image stabilization and 40m waterproof housing. Two color screens.',
    brand: 'TechPro',
    category: 'Electronics',
    image:
      'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600',
    images: [
      'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800',
      'https://images.unsplash.com/photo-1526045431048-f857369baa09?w=800',
    ],
    pricing: { price: 4999, originalPrice: 7499, discount: 33 },
    specs: [
      buildSpec('s1', 'Camera', 'Resolution', '4K @ 30fps'),
      buildSpec('s2', 'HardDrive', 'Storage', 'microSD up to 256GB'),
      buildSpec('s3', 'Battery', 'Battery', '1350 mAh'),
    ],
    stock: { inStock: true, stockCount: 6 },
    deliveryTime: '1 Day',
    rating: 4.4,
    reviewCount: 188,
  },
  {
    id: 8,
    name: 'Smartphone Gimbal Stabilizer',
    description:
      '3-axis gimbal with face-tracking, time-lapse, and gesture control. Built-in selfie stick and tripod.',
    brand: 'TechPro',
    category: 'Electronics',
    image:
      'https://images.unsplash.com/photo-1574169208507-84376144848b?w=600',
    images: [
      'https://images.unsplash.com/photo-1574169208507-84376144848b?w=800',
      'https://images.unsplash.com/photo-1606987661053-e7eb29eda60d?w=800',
    ],
    pricing: { price: 3299, originalPrice: 4999, discount: 34 },
    specs: [
      buildSpec('s1', 'Smartphone', 'Compatibility', 'Phones up to 280g'),
      buildSpec('s2', 'Battery', 'Runtime', 'Up to 12 hours'),
      buildSpec('s3', 'Settings', 'Modes', 'Pan / Follow / Lock'),
    ],
    stock: { inStock: true, stockCount: 14 },
    deliveryTime: '4 Hours',
    rating: 4.3,
    reviewCount: 95,
  },
  {
    id: 9,
    name: 'Portable Bluetooth Speaker',
    description:
      'Punchy 360° sound with deep bass, IPX7 waterproof, and 24-hour playtime. Pair two speakers for stereo.',
    brand: 'TechPro',
    category: 'Electronics',
    image:
      'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600',
    images: [
      'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800',
      'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800',
    ],
    pricing: { price: 1599, originalPrice: 2499, discount: 36 },
    specs: [
      buildSpec('s1', 'Bluetooth', 'Connectivity', 'Bluetooth 5.1'),
      buildSpec('s2', 'Battery', 'Battery', '24 hours'),
      buildSpec('s3', 'Headphones', 'Output', '20W RMS'),
    ],
    stock: { inStock: true, stockCount: 22 },
    deliveryTime: '2 Hours',
    rating: 4.6,
    reviewCount: 432,
  },
  {
    id: 10,
    name: 'USB-C Hub 8-in-1 Adapter',
    description:
      '8-in-1 hub with 4K HDMI, 100W PD, SD/TF readers, and 3 USB ports. Plug and play, no drivers needed.',
    brand: 'TechPro',
    category: 'Electronics',
    image:
      'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600',
    images: [
      'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800',
      'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=800',
    ],
    pricing: { price: 1199, originalPrice: 1799, discount: 33 },
    specs: [
      buildSpec('s1', 'Usb', 'Ports', '3x USB 3.0 + USB-C PD'),
      buildSpec('s2', 'Monitor', 'Video', 'HDMI 4K @ 30Hz'),
      buildSpec('s3', 'HardDrive', 'Card Reader', 'SD + microSD'),
    ],
    stock: { inStock: true, stockCount: 35 },
    deliveryTime: '2 Hours',
    rating: 4.5,
    reviewCount: 268,
  },
  {
    id: 11,
    name: 'Ergonomic Office Chair',
    description:
      'Mesh ergonomic chair with adjustable lumbar support, 4D armrests, and breathable backrest for all-day comfort.',
    brand: 'HomeLux',
    category: 'Home',
    image:
      'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=600',
    images: [
      'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800',
      'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800',
    ],
    pricing: { price: 8999, originalPrice: 13999, discount: 36 },
    specs: [
      buildSpec('s1', 'Armchair', 'Support', 'Adjustable lumbar'),
      buildSpec('s2', 'SlidersHorizontal', 'Armrests', '4D adjustable'),
      buildSpec('s3', 'Square', 'Weight Capacity', '150 kg'),
    ],
    stock: { inStock: true, stockCount: 4 },
    deliveryTime: '1 Day',
    rating: 4.8,
    reviewCount: 76,
  },
  {
    id: 12,
    name: 'Mini Projector Full HD',
    description:
      'Full HD native 1080p projector with 9000 lumens and 200" screen support. Built-in speakers and HDMI/USB.',
    brand: 'HomeLux',
    category: 'Electronics',
    image:
      'https://images.unsplash.com/photo-1626218174358-7769486f3a6f?w=600',
    images: [
      'https://images.unsplash.com/photo-1626218174358-7769486f3a6f?w=800',
      'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800',
    ],
    pricing: { price: 6499, originalPrice: 9999, discount: 35 },
    specs: [
      buildSpec('s1', 'Monitor', 'Resolution', 'Native 1080p'),
      buildSpec('s2', 'Lightbulb', 'Brightness', '9000 lumens'),
      buildSpec('s3', 'Usb', 'Inputs', 'HDMI, USB, AV'),
    ],
    stock: { inStock: true, stockCount: 9 },
    deliveryTime: '4 Hours',
    rating: 4.4,
    reviewCount: 142,
  },
]

// -----------------------------------------------------------------------------
// Lookup Helpers
// -----------------------------------------------------------------------------

export const getProductById = (id: number | string): ProductDetails | undefined => {
  const numericId = typeof id === 'string' ? Number(id) : id
  return products.find((p) => p.id === numericId)
}

export const getRecentProducts = (
  excludeId: number,
  count = 6,
): ProductDetails[] =>
  products.filter((p) => p.id !== excludeId).slice(0, count)

export const getRelatedProducts = (
  excludeId: number,
  count = 16,
): ProductDetails[] => {
  const current = getProductById(excludeId)
  const others = products.filter((p) => p.id !== excludeId)
  if (!current) return others.slice(0, count)

  const sameCategory = others.filter((p) => p.category === current.category)
  const rest = others.filter((p) => p.category !== current.category)
  return [...sameCategory, ...rest].slice(0, count)
}

export const toProductCard = (p: ProductDetails): ProductCard => ({
  id: p.id,
  name: p.name,
  image: p.image,
  price: p.pricing.price,
  originalPrice: p.pricing.originalPrice,
  discount: p.pricing.discount,
})

// -----------------------------------------------------------------------------
// Banners
// -----------------------------------------------------------------------------

export const dealBanners: DealBanner[] = [
  {
    id: 1,
    image:
      'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600',
    title: 'Up to 70% Off',
    subtitle: 'Black Friday',
    bgClass: 'bg-rose-500',
    link: '/allProducts?sale=black-friday',
  },
  {
    id: 2,
    image:
      'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=600',
    title: 'Mega Sale',
    subtitle: 'Electronics',
    bgClass: 'bg-violet-600',
    link: '/allProducts?category=electronics',
  },
  {
    id: 3,
    image:
      'https://images.unsplash.com/photo-1607083206325-caf1edba7a83?w=600',
    title: 'Flat 50% Off',
    subtitle: 'Fashion Week',
    bgClass: 'bg-amber-500',
    link: '/allProducts?category=fashion',
  },
  {
    id: 4,
    image:
      'https://images.unsplash.com/photo-1607083207685-aaf05f2c908c?w=600',
    title: 'Buy 1 Get 1',
    subtitle: 'Home Essentials',
    bgClass: 'bg-emerald-600',
    link: '/allProducts?category=home',
  },
  {
    id: 5,
    image:
      'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=600',
    title: 'New Arrivals',
    subtitle: 'This Week',
    bgClass: 'bg-indigo-600',
    link: '/allProducts?sort=newest',
  },
]

export const promoBanners: PromoBanner[] = [
  {
    id: 1,
    image:
      'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=800',
    title: 'Mega Sale',
    subtitle: 'Save Big Today',
    discount: 'UP TO 60% OFF',
    bgClass: 'bg-violet-700',
    link: '/allProducts?sale=mega',
  },
  {
    id: 2,
    image:
      'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800',
    title: 'Holiday Deals',
    subtitle: 'Limited Time',
    discount: 'EXTRA 20%',
    bgClass: 'bg-rose-600',
    link: '/allProducts?sale=holiday',
  },
]
