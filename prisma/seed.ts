import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

/**
 * Development seed for the EnterFly storefront.
 *
 * Builds a realistic Bangladeshi e-commerce dataset:
 *   - admin + normal users (authenticated checkout only, no guests)
 *   - categories, products, variants (SKU/color/size/price/stock)
 *   - product images, carts, wishlists
 *   - orders with full variant snapshots, payments, promo usage
 *   - inventory logs, store settings, contact messages
 *   - unified banners for every type (CAROUSEL/CATEGORY/TOP/DEAL/PROMO)
 *
 * This is destructive: it wipes existing rows in FK-safe order before
 * inserting fresh demo data. Safe for development only.
 */

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const SALT_ROUNDS = 12;
const D = (value: number) => new Prisma.Decimal(value.toFixed(2));

/* -------------------------------------------------------------------------- */
/*  Reset                                                                     */
/* -------------------------------------------------------------------------- */

async function reset() {
  // Delete in dependency order (children first) so FK restrictions pass.
  await prisma.promoCodeUsage.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  await prisma.inventoryLog.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.address.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.category.deleteMany();
  await prisma.promoCode.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.storeSettings.deleteMany();
  await prisma.review.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.user.deleteMany();
}

/* -------------------------------------------------------------------------- */
/*  Users                                                                     */
/* -------------------------------------------------------------------------- */

async function seedUsers() {
  const password = await bcrypt.hash("Password123!", SALT_ROUNDS);
  const now = new Date();

  const admin = await prisma.user.create({
    data: {
      name: "Tanvir Ahmed",
      email: "admin@enterfly.com",
      password,
      phone: "01711000001",
      city: "Dhaka",
      role: "ADMIN",
      provider: "CREDENTIAL",
      termsAcceptedAt: now,
    },
  });

  const rahim = await prisma.user.create({
    data: {
      name: "Rahim Uddin",
      email: "rahim@example.com",
      password,
      phone: "01811000002",
      city: "Chattogram",
      role: "USER",
      provider: "CREDENTIAL",
      termsAcceptedAt: now,
      addresses: {
        create: {
          fullName: "Rahim Uddin",
          phone: "01811000002",
          city: "Chattogram",
          area: "Agrabad",
          address: "House 12, Road 4, Agrabad C/A",
          postalCode: "4100",
          isDefault: true,
        },
      },
    },
  });

  const karim = await prisma.user.create({
    data: {
      name: "Karim Hossain",
      email: "karim@example.com",
      password,
      phone: "01911000003",
      city: "Sylhet",
      role: "USER",
      provider: "CREDENTIAL",
      termsAcceptedAt: now,
      addresses: {
        create: {
          fullName: "Karim Hossain",
          phone: "01911000003",
          city: "Sylhet",
          area: "Zindabazar",
          address: "Flat B3, Kushighat, Zindabazar",
          postalCode: "3100",
          isDefault: true,
        },
      },
    },
  });

  // A Google OAuth user has no password (nullable column).
  const nadia = await prisma.user.create({
    data: {
      name: "Nadia Islam",
      email: "nadia@gmail.com",
      password: null,
      phone: "01611000004",
      city: "Dhaka",
      image: "https://i.pravatar.cc/150?img=47",
      role: "USER",
      provider: "GOOGLE",
      termsAcceptedAt: now,
      addresses: {
        create: {
          fullName: "Nadia Islam",
          phone: "01611000004",
          city: "Dhaka",
          area: "Dhanmondi",
          address: "Apt 5A, Road 27, Dhanmondi",
          postalCode: "1209",
          isDefault: true,
        },
      },
    },
  });

  return { admin, rahim, karim, nadia };
}

/* -------------------------------------------------------------------------- */
/*  Categories + products + variants + images                                 */
/* -------------------------------------------------------------------------- */

type VariantSeed = {
  sku: string;
  color?: string;
  size?: string;
  price: number;
  salePrice?: number;
  stock: number;
};

type ProductSeed = {
  name: string;
  slug: string;
  description: string;
  images: string[];
  variants: VariantSeed[];
};

type CategorySeed = {
  name: string;
  slug: string;
  description: string;
  image: string;
  products: ProductSeed[];
};

const CATEGORIES: CategorySeed[] = [
  {
    name: "Electronics",
    slug: "electronics",
    description: "Gadgets, accessories, and everyday tech.",
    image:
      "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&fit=crop",
    products: [
      {
        name: "Wireless Bluetooth Earbuds",
        slug: "wireless-bluetooth-earbuds",
        description: "True wireless earbuds with deep bass and 24h battery.",
        images: [
          "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600&fit=crop",
          "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&fit=crop",
        ],
        variants: [
          { sku: "EARBUD-BLK", color: "Black", price: 2490, salePrice: 1990, stock: 60 },
          { sku: "EARBUD-WHT", color: "White", price: 2490, stock: 35 },
        ],
      },
      {
        name: "Smart Fitness Watch",
        slug: "smart-fitness-watch",
        description: "Heart-rate, SpO2, and sleep tracking with AMOLED display.",
        images: [
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&fit=crop",
        ],
        variants: [
          { sku: "WATCH-BLK-42", color: "Black", size: "42mm", price: 3990, salePrice: 3490, stock: 40 },
          { sku: "WATCH-SLV-46", color: "Silver", size: "46mm", price: 4490, stock: 22 },
        ],
      },
      {
        name: "20000mAh Power Bank",
        slug: "20000mah-power-bank",
        description: "Fast-charging power bank with dual USB and USB-C PD.",
        images: [
          "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&fit=crop",
        ],
        variants: [
          { sku: "PWR-20K-BLK", color: "Black", price: 1790, salePrice: 1490, stock: 80 },
        ],
      },
    ],
  },
  {
    name: "Fashion",
    slug: "fashion",
    description: "Trending apparel for men and women.",
    image:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&fit=crop",
    products: [
      {
        name: "Premium Cotton Panjabi",
        slug: "premium-cotton-panjabi",
        description: "Handcrafted cotton panjabi, perfect for Eid and festivals.",
        images: [
          "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&fit=crop",
        ],
        variants: [
          { sku: "PANJABI-WHT-M", color: "White", size: "M", price: 1850, stock: 25 },
          { sku: "PANJABI-WHT-L", color: "White", size: "L", price: 1850, salePrice: 1599, stock: 30 },
          { sku: "PANJABI-NVY-L", color: "Navy", size: "L", price: 1950, stock: 18 },
        ],
      },
      {
        name: "Women's Cotton Saree",
        slug: "womens-cotton-saree",
        description: "Soft handloom cotton saree with traditional border.",
        images: [
          "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&fit=crop",
        ],
        variants: [
          { sku: "SAREE-RED", color: "Red", price: 2750, salePrice: 2450, stock: 20 },
          { sku: "SAREE-GRN", color: "Green", price: 2750, stock: 15 },
        ],
      },
    ],
  },
  {
    name: "Home & Kitchen",
    slug: "home-kitchen",
    description: "Appliances and essentials for a better home.",
    image:
      "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=600&fit=crop",
    products: [
      {
        name: "Non-Stick Cookware Set",
        slug: "non-stick-cookware-set",
        description: "5-piece non-stick cookware set with heat-resistant handles.",
        images: [
          "https://images.unsplash.com/photo-1584990347449-a2d4c2c9b4f8?w=600&fit=crop",
        ],
        variants: [
          { sku: "COOK-5PC", price: 3490, salePrice: 2990, stock: 28 },
        ],
      },
      {
        name: "Electric Rice Cooker 1.8L",
        slug: "electric-rice-cooker-1-8l",
        description: "Energy-efficient rice cooker with keep-warm function.",
        images: [
          "https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&fit=crop",
        ],
        variants: [
          { sku: "RICE-1.8L", price: 2290, stock: 45 },
        ],
      },
    ],
  },
  {
    name: "Beauty & Personal Care",
    slug: "beauty-personal-care",
    description: "Skincare, haircare, and grooming essentials.",
    image:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&fit=crop",
    products: [
      {
        name: "Herbal Face Wash",
        slug: "herbal-face-wash",
        description: "Gentle herbal face wash for daily glow.",
        images: [
          "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&fit=crop",
        ],
        variants: [
          { sku: "FACE-100ML", size: "100ml", price: 390, salePrice: 320, stock: 120 },
        ],
      },
    ],
  },
];

async function seedCatalog() {
  const productsBySlug = new Map<
    string,
    Awaited<ReturnType<typeof prisma.product.findFirstOrThrow>>
  >();
  const variantsBySku = new Map<string, { id: string; productId: string }>();
  const categoryBySlug = new Map<string, { id: string }>();

  for (const cat of CATEGORIES) {
    const category = await prisma.category.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image,
        status: "ACTIVE",
      },
    });
    categoryBySlug.set(cat.slug, category);

    for (const prod of cat.products) {
      const product = await prisma.product.create({
        data: {
          name: prod.name,
          slug: prod.slug,
          description: prod.description,
          status: "ACTIVE",
          categoryId: category.id,
          images: {
            create: prod.images.map((url, index) => ({
              url,
              alt: prod.name,
              position: index,
            })),
          },
          variants: {
            create: prod.variants.map((v) => ({
              sku: v.sku,
              color: v.color ?? null,
              size: v.size ?? null,
              price: D(v.price),
              salePrice: v.salePrice != null ? D(v.salePrice) : null,
              stock: v.stock,
            })),
          },
        },
        include: { variants: true },
      });

      productsBySlug.set(prod.slug, product);
      for (const variant of product.variants) {
        variantsBySku.set(variant.sku, {
          id: variant.id,
          productId: product.id,
        });

        // Opening-stock ledger entry per variant.
        await prisma.inventoryLog.create({
          data: {
            variantId: variant.id,
            type: "STOCK_IN",
            quantity: variant.stock,
            note: "Initial seed stock",
          },
        });
      }
    }
  }

  return { productsBySlug, variantsBySku, categoryBySlug };
}

/* -------------------------------------------------------------------------- */
/*  Carts + wishlists                                                         */
/* -------------------------------------------------------------------------- */

async function seedCartsAndWishlists(
  users: Awaited<ReturnType<typeof seedUsers>>,
  variantsBySku: Map<string, { id: string; productId: string }>,
) {
  const v = (sku: string) => {
    const found = variantsBySku.get(sku);
    if (!found) throw new Error(`Seed: variant ${sku} not found`);
    return found;
  };

  const earbud = v("EARBUD-BLK");
  const watch = v("WATCH-BLK-42");
  const panjabi = v("PANJABI-WHT-L");
  const faceWash = v("FACE-100ML");

  await prisma.cartItem.createMany({
    data: [
      { userId: users.rahim.id, productId: earbud.productId, variantId: earbud.id, quantity: 1 },
      { userId: users.rahim.id, productId: faceWash.productId, variantId: faceWash.id, quantity: 2 },
      { userId: users.nadia.id, productId: watch.productId, variantId: watch.id, quantity: 1 },
    ],
  });

  await prisma.wishlist.createMany({
    data: [
      { userId: users.rahim.id, productId: watch.productId },
      { userId: users.karim.id, productId: panjabi.productId },
      { userId: users.nadia.id, productId: earbud.productId },
    ],
  });
}

/* -------------------------------------------------------------------------- */
/*  Promo codes                                                               */
/* -------------------------------------------------------------------------- */

async function seedPromoCodes() {
  const welcome = await prisma.promoCode.create({
    data: {
      code: "WELCOME10",
      description: "10% off your first order.",
      discountType: "PERCENT",
      value: D(10),
      minOrder: D(1000),
      maxDiscount: D(500),
      usageLimit: 1000,
      usedCount: 0,
      status: "ACTIVE",
    },
  });

  const flat200 = await prisma.promoCode.create({
    data: {
      code: "EID200",
      description: "Flat BDT 200 off on orders above 3000.",
      discountType: "FLAT",
      value: D(200),
      minOrder: D(3000),
      usageLimit: 500,
      usedCount: 0,
      status: "ACTIVE",
    },
  });

  return { welcome, flat200 };
}

/* -------------------------------------------------------------------------- */
/*  Orders (with variant snapshots), payments, promo usage                    */
/* -------------------------------------------------------------------------- */

function orderNumber(seq: number) {
  const now = new Date();
  const yy = String(now.getUTCFullYear()).slice(-2);
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  return `ORD-${yy}${mm}${dd}-SEED${String(seq).padStart(4, "0")}`;
}

async function seedOrders(
  users: Awaited<ReturnType<typeof seedUsers>>,
  variantsBySku: Map<string, { id: string; productId: string }>,
  promos: Awaited<ReturnType<typeof seedPromoCodes>>,
) {
  // Order 1: Rahim, delivered + paid, two lines, promo applied.
  const order1 = await prisma.order.create({
    data: {
      orderNumber: orderNumber(1),
      userId: users.rahim.id,
      subtotal: D(1990 + 320 * 2), // earbud sale + 2x face wash sale
      deliveryCharge: D(0),
      discountAmount: D(263), // ~10% of 2630, capped under maxDiscount
      taxAmount: D(118.35),
      totalAmount: D(1990 + 640 - 263 + 118.35),
      customerName: "Rahim Uddin",
      customerPhone: "01811000002",
      customerAddress: "House 12, Road 4, Agrabad C/A",
      customerCity: "Chattogram",
      customerArea: "Agrabad",
      customerPostalCode: "4100",
      customerEmail: "rahim@example.com",
      promoCode: "WELCOME10",
      status: "DELIVERED",
      paymentMethod: "CASH_ON_DELIVERY",
      paymentStatus: "PAID",
      items: {
        create: [
          {
            productId: variantsBySku.get("EARBUD-BLK")!.productId,
            variantId: variantsBySku.get("EARBUD-BLK")!.id,
            productName: "Wireless Bluetooth Earbuds",
            productImage:
              "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600&fit=crop",
            sku: "EARBUD-BLK",
            color: "Black",
            size: null,
            quantity: 1,
            unitPrice: D(1990),
            totalPrice: D(1990),
          },
          {
            productId: variantsBySku.get("FACE-100ML")!.productId,
            variantId: variantsBySku.get("FACE-100ML")!.id,
            productName: "Herbal Face Wash",
            productImage:
              "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&fit=crop",
            sku: "FACE-100ML",
            color: null,
            size: "100ml",
            quantity: 2,
            unitPrice: D(320),
            totalPrice: D(640),
          },
        ],
      },
      payments: {
        create: {
          provider: "CASH_ON_DELIVERY",
          transactionId: null,
          amount: D(1990 + 640 - 263 + 118.35),
          currency: "BDT",
          status: "SUCCESS",
        },
      },
    },
  });

  await prisma.promoCodeUsage.create({
    data: {
      promoCodeId: promos.welcome.id,
      userId: users.rahim.id,
      orderId: order1.id,
    },
  });
  await prisma.promoCode.update({
    where: { id: promos.welcome.id },
    data: { usedCount: { increment: 1 } },
  });

  // Order 2: Nadia, pending + unpaid (COD), single line, no promo.
  await prisma.order.create({
    data: {
      orderNumber: orderNumber(2),
      userId: users.nadia.id,
      subtotal: D(3490),
      deliveryCharge: D(120),
      discountAmount: D(0),
      taxAmount: D(174.5),
      totalAmount: D(3490 + 120 + 174.5),
      customerName: "Nadia Islam",
      customerPhone: "01611000004",
      customerAddress: "Apt 5A, Road 27, Dhanmondi",
      customerCity: "Dhaka",
      customerArea: "Dhanmondi",
      customerPostalCode: "1209",
      customerEmail: "nadia@gmail.com",
      status: "PENDING",
      paymentMethod: "CASH_ON_DELIVERY",
      paymentStatus: "UNPAID",
      items: {
        create: [
          {
            productId: variantsBySku.get("WATCH-BLK-42")!.productId,
            variantId: variantsBySku.get("WATCH-BLK-42")!.id,
            productName: "Smart Fitness Watch",
            productImage:
              "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&fit=crop",
            sku: "WATCH-BLK-42",
            color: "Black",
            size: "42mm",
            quantity: 1,
            unitPrice: D(3490),
            totalPrice: D(3490),
          },
        ],
      },
      payments: {
        create: {
          provider: "CASH_ON_DELIVERY",
          amount: D(3490 + 120 + 174.5),
          currency: "BDT",
          status: "PENDING",
        },
      },
    },
  });

  // Order 3: Karim, processing + paid online, panjabi line, flat promo.
  const order3 = await prisma.order.create({
    data: {
      orderNumber: orderNumber(3),
      userId: users.karim.id,
      subtotal: D(1599 + 1950),
      deliveryCharge: D(120),
      discountAmount: D(200),
      taxAmount: D(167.45),
      totalAmount: D(1599 + 1950 + 120 - 200 + 167.45),
      customerName: "Karim Hossain",
      customerPhone: "01911000003",
      customerAddress: "Flat B3, Kushighat, Zindabazar",
      customerCity: "Sylhet",
      customerArea: "Zindabazar",
      customerPostalCode: "3100",
      customerEmail: "karim@example.com",
      promoCode: "EID200",
      status: "PROCESSING",
      paymentMethod: "ONLINE",
      paymentStatus: "PAID",
      items: {
        create: [
          {
            productId: variantsBySku.get("PANJABI-WHT-L")!.productId,
            variantId: variantsBySku.get("PANJABI-WHT-L")!.id,
            productName: "Premium Cotton Panjabi",
            productImage:
              "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&fit=crop",
            sku: "PANJABI-WHT-L",
            color: "White",
            size: "L",
            quantity: 1,
            unitPrice: D(1599),
            totalPrice: D(1599),
          },
          {
            productId: variantsBySku.get("PANJABI-NVY-L")!.productId,
            variantId: variantsBySku.get("PANJABI-NVY-L")!.id,
            productName: "Premium Cotton Panjabi",
            productImage:
              "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&fit=crop",
            sku: "PANJABI-NVY-L",
            color: "Navy",
            size: "L",
            quantity: 1,
            unitPrice: D(1950),
            totalPrice: D(1950),
          },
        ],
      },
      payments: {
        create: {
          provider: "SSLCommerz",
          transactionId: "SSLCZ-SEED-3-0001",
          amount: D(1599 + 1950 + 120 - 200 + 167.45),
          currency: "BDT",
          status: "SUCCESS",
          rawResponse: { gateway: "SSLCommerz", demo: true },
        },
      },
    },
  });

  await prisma.promoCodeUsage.create({
    data: {
      promoCodeId: promos.flat200.id,
      userId: users.karim.id,
      orderId: order3.id,
    },
  });
  await prisma.promoCode.update({
    where: { id: promos.flat200.id },
    data: { usedCount: { increment: 1 } },
  });

  // Ledger entries reflecting stock leaving for the paid/processing orders.
  await prisma.inventoryLog.createMany({
    data: [
      {
        variantId: variantsBySku.get("EARBUD-BLK")!.id,
        type: "ORDER_PLACED",
        quantity: -1,
        note: `Order ${order1.orderNumber}`,
      },
      {
        variantId: variantsBySku.get("FACE-100ML")!.id,
        type: "ORDER_PLACED",
        quantity: -2,
        note: `Order ${order1.orderNumber}`,
      },
      {
        variantId: variantsBySku.get("PANJABI-WHT-L")!.id,
        type: "ORDER_PLACED",
        quantity: -1,
        note: `Order ${order3.orderNumber}`,
      },
      {
        variantId: variantsBySku.get("PANJABI-NVY-L")!.id,
        type: "ORDER_PLACED",
        quantity: -1,
        note: `Order ${order3.orderNumber}`,
      },
    ],
  });
}

/* -------------------------------------------------------------------------- */
/*  Store settings + contact messages                                         */
/* -------------------------------------------------------------------------- */

async function seedSettingsAndMessages() {
  await prisma.storeSettings.create({
    data: {
      taxRate: new Prisma.Decimal("0.05"),
      standardShippingFee: D(120),
      freeShippingThreshold: D(5000),
      expressShippingFee: D(250),
      currency: "BDT",
    },
  });

  await prisma.contactMessage.createMany({
    data: [
      {
        name: "Sadia Rahman",
        email: "sadia@example.com",
        phone: "01712345678",
        subject: "Delivery time to Khulna?",
        message: "How long does delivery usually take to Khulna city?",
        status: "NEW",
      },
      {
        name: "Imran Khan",
        email: "imran@example.com",
        phone: "01898765432",
        subject: "Bulk order discount",
        message: "Do you offer discounts on bulk corporate orders?",
        status: "READ",
      },
    ],
  });
}

/* -------------------------------------------------------------------------- */
/*  Unified banners                                                           */
/* -------------------------------------------------------------------------- */

async function seedBanners(categoryBySlug: Map<string, { id: string }>) {
  const electronics = categoryBySlug.get("electronics");
  const fashion = categoryBySlug.get("fashion");

  await prisma.banner.createMany({
    data: [
      // CAROUSEL — hero rotator (gradient + badge in metadata).
      {
        type: "CAROUSEL",
        title: "25% OFF",
        subtitle: "ELECTRONICS",
        description: "Top gadgets delivered fast across Bangladesh.",
        image:
          "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=500&fit=crop",
        link: "/products?category=electronics",
        position: 0,
        status: "ACTIVE",
        metadata: {
          badge: "Weekend Special",
          bgFrom: "from-blue-500",
          bgVia: "via-indigo-600",
          bgTo: "to-blue-800",
        },
      },
      {
        type: "CAROUSEL",
        title: "EID COLLECTION",
        subtitle: "FASHION",
        description: "Premium panjabi and saree for the festive season.",
        image:
          "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=500&fit=crop",
        link: "/products?category=fashion",
        position: 1,
        status: "ACTIVE",
        metadata: {
          badge: "Flash Deal",
          bgFrom: "from-rose-500",
          bgVia: "via-pink-600",
          bgTo: "to-rose-800",
        },
      },
      // TOP — thin promo strip (icons/tags in metadata, no image).
      {
        type: "TOP",
        description: "on all electronics",
        position: 0,
        status: "ACTIVE",
        metadata: {
          icon: "Tag",
          badge: "MEGA SALE",
          discount: "Up to 40% OFF",
          tag: "Limited Time Only",
          tagIcon: "Sparkles",
        },
      },
      // DEAL — product-details carousel (bgClass in metadata).
      {
        type: "DEAL",
        title: "Up to 50% Off",
        subtitle: "Gadget Fest",
        image:
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&fit=crop",
        link: "/products?category=electronics",
        position: 0,
        status: "ACTIVE",
        metadata: { bgClass: "bg-blue-600" },
      },
      {
        type: "DEAL",
        title: "Festive Picks",
        subtitle: "Eid Special",
        image:
          "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&fit=crop",
        link: "/products?category=fashion",
        position: 1,
        status: "ACTIVE",
        metadata: { bgClass: "bg-rose-500" },
      },
      // PROMO — product-details side rail (discount + bgClass in metadata).
      {
        type: "PROMO",
        title: "Mega Sale",
        subtitle: "Save Big Today",
        image:
          "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&fit=crop",
        link: "/products",
        position: 0,
        status: "ACTIVE",
        metadata: { discount: "UP TO 60% OFF", bgClass: "bg-violet-700" },
      },
    ],
  });

  // CATEGORY banners need a real FK to a category (relation + index).
  if (electronics) {
    await prisma.banner.create({
      data: {
        type: "CATEGORY",
        description: "Best deals on the latest tech, delivered fast.",
        image:
          "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&fit=crop",
        link: "/products?category=electronics",
        status: "ACTIVE",
        categoryId: electronics.id,
        metadata: { label: "SALE", heading: "TECH FEST", discount: "40%" },
      },
    });
  }
  if (fashion) {
    await prisma.banner.create({
      data: {
        type: "CATEGORY",
        description: "Festive fashion for the whole family.",
        image:
          "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&fit=crop",
        link: "/products?category=fashion",
        status: "ACTIVE",
        categoryId: fashion.id,
        metadata: { label: "MEGA DEAL", heading: "EID SALE", discount: "30%" },
      },
    });
  }
}

/* -------------------------------------------------------------------------- */
/*  Testimonials (About page "Loved by shoppers")                             */
/* -------------------------------------------------------------------------- */

async function seedTestimonials() {
  await prisma.testimonial.createMany({
    data: [
      {
        name: "Sneha Iyer",
        location: "Mumbai",
        image:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
        rating: 5,
        text: "EnterFly is my go-to for everyday shopping. Same-day delivery from local stores feels like magic, and the prices are unbeatable.",
        position: 0,
        status: "ACTIVE",
      },
      {
        name: "Karan Patel",
        location: "Bengaluru",
        image:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
        rating: 5,
        text: "Clean app, real deals, and genuine products. I love that every store is verified. Customer support helped me within minutes.",
        position: 1,
        status: "ACTIVE",
      },
      {
        name: "Nidhi Rao",
        location: "Pune",
        image:
          "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=200",
        rating: 4,
        text: "The flash sale section keeps me coming back. Quality has been consistent across groceries, fashion, and electronics.",
        position: 2,
        status: "ACTIVE",
      },
    ],
  });
}

/* -------------------------------------------------------------------------- */
/*  Main                                                                      */
/* -------------------------------------------------------------------------- */

async function main() {
  console.log("🌱 Seeding EnterFly demo data...");
  await reset();

  const users = await seedUsers();
  console.log("  ✓ users (1 admin, 2 credential, 1 google)");

  const { variantsBySku, categoryBySlug } = await seedCatalog();
  console.log(`  ✓ categories, products, ${variantsBySku.size} variants, images`);

  await seedCartsAndWishlists(users, variantsBySku);
  console.log("  ✓ carts + wishlists");

  const promos = await seedPromoCodes();
  console.log("  ✓ promo codes");

  await seedOrders(users, variantsBySku, promos);
  console.log("  ✓ orders + payments + promo usage + inventory logs");

  await seedSettingsAndMessages();
  console.log("  ✓ store settings + contact messages");

  await seedBanners(categoryBySlug);
  console.log("  ✓ unified banners (CAROUSEL, CATEGORY, TOP, DEAL, PROMO)");

  await seedTestimonials();
  console.log("  ✓ testimonials (About page)");

  console.log("✅ Seed complete.");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
