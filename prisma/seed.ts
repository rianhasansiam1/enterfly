import "dotenv/config";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";


const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

/**
 * Large demo seed for EnterFly-style ecommerce.
 *
 * Default volume:
 * - 18 categories
 * - 180 products
 * - 540 variants
 * - 540+ product images
 * - 100 users
 * - 140 addresses
 * - 250 wishlist rows
 * - 220 cart rows
 * - 320 orders with 700+ order items
 * - reviews, banners, promo codes, payments, inventory logs, testimonials, contact messages
 *
 * Run:
 *   npm i bcryptjs
 *   npx prisma db seed
 *
 * package.json:
 *   "prisma": { "seed": "tsx prisma/seed.ts" }
 */

type CreatedCategory = Awaited<ReturnType<typeof prisma.category.create>>;
type CreatedProduct = Awaited<ReturnType<typeof prisma.product.create>>;
type CreatedVariant = Awaited<ReturnType<typeof prisma.productVariant.create>>;
type CreatedUser = Awaited<ReturnType<typeof prisma.user.create>>;
type CreatedAddress = Awaited<ReturnType<typeof prisma.address.create>>;
type CreatedPromo = Awaited<ReturnType<typeof prisma.promoCode.create>>;

const CONFIG = {
  productsPerCategory: 10,
  variantsPerProduct: 3,
  userCount: 100,
  orderCount: 320,
  wishlistCount: 250,
  cartCount: 220,
  contactMessageCount: 70,
};

const PASSWORD = "Demo@12345";

const categorySeed = [
  ["Electronics", "electronics"],
  ["Mobile Phones", "mobile-phones"],
  ["Laptops & Computers", "laptops-computers"],
  ["Fashion", "fashion"],
  ["Men's Clothing", "mens-clothing"],
  ["Women's Clothing", "womens-clothing"],
  ["Shoes", "shoes"],
  ["Watches", "watches"],
  ["Home & Living", "home-living"],
  ["Kitchen Appliances", "kitchen-appliances"],
  ["Beauty & Personal Care", "beauty-personal-care"],
  ["Health & Fitness", "health-fitness"],
  ["Grocery", "grocery"],
  ["Baby Products", "baby-products"],
  ["Sports & Outdoor", "sports-outdoor"],
  ["Books & Stationery", "books-stationery"],
  ["Automotive", "automotive"],
  ["Gaming Accessories", "gaming-accessories"],
] as const;

const cities = [
  "Dhaka",
  "Chattogram",
  "Sylhet",
  "Rajshahi",
  "Khulna",
  "Barishal",
  "Rangpur",
  "Cumilla",
  "Gazipur",
  "Narayanganj",
];

const areas = [
  "Mirpur",
  "Dhanmondi",
  "Uttara",
  "Banani",
  "Bashundhara",
  "Mohammadpur",
  "Khilgaon",
  "Agrabad",
  "Zindabazar",
  "New Market",
];

const colors = ["Black", "White", "Blue", "Red", "Green", "Silver", "Gold", "Navy", "Gray", "Brown"];
const sizes = ["S", "M", "L", "XL", "42", "44", "128GB", "256GB", "500ml", "1kg"];

const firstNames = [
  "Aarif",
  "Rahim",
  "Karim",
  "Sabbir",
  "Nafis",
  "Rafi",
  "Siam",
  "Fahim",
  "Hasan",
  "Tanvir",
  "Nusrat",
  "Mim",
  "Tanha",
  "Sadia",
  "Raisa",
  "Farhana",
  "Jannat",
  "Mahi",
  "Tisha",
  "Nabila",
];

const lastNames = [
  "Ahmed",
  "Hasan",
  "Rahman",
  "Islam",
  "Hossain",
  "Chowdhury",
  "Khan",
  "Sarkar",
  "Molla",
  "Akter",
];

const productWords: Record<string, string[]> = {
  "electronics": ["Bluetooth Speaker", "Wireless Earbuds", "Power Bank", "Smart LED TV", "USB Hub", "Router", "Action Camera", "Smart Plug"],
  "mobile-phones": ["Android Phone", "Feature Phone", "Phone Case", "Fast Charger", "Screen Protector", "Type-C Cable"],
  "laptops-computers": ["Gaming Laptop", "Business Laptop", "Mechanical Keyboard", "Wireless Mouse", "Monitor", "Laptop Stand"],
  "fashion": ["Casual Shirt", "Premium Hoodie", "Denim Jacket", "Cotton T-Shirt", "Panjabi", "Joggers"],
  "mens-clothing": ["Formal Shirt", "Polo Shirt", "Slim Fit Pant", "Cotton Panjabi", "Blazer", "Jeans"],
  "womens-clothing": ["Kurti", "Salwar Kameez", "Saree", "Tunic", "Scarf", "Long Dress"],
  "shoes": ["Running Shoe", "Sneaker", "Formal Shoe", "Sandal", "Sports Shoe", "Loafer"],
  "watches": ["Smart Watch", "Analog Watch", "Digital Watch", "Fitness Band", "Leather Watch", "Classic Watch"],
  "home-living": ["Bedsheet", "Curtain", "Wall Clock", "Storage Box", "Table Lamp", "Floor Mat"],
  "kitchen-appliances": ["Rice Cooker", "Blender", "Electric Kettle", "Air Fryer", "Pressure Cooker", "Toaster"],
  "beauty-personal-care": ["Face Wash", "Moisturizer", "Sunscreen", "Hair Dryer", "Trimmer", "Perfume"],
  "health-fitness": ["Dumbbell Set", "Yoga Mat", "Treadmill Belt", "Skipping Rope", "Fitness Bottle", "Resistance Band"],
  "grocery": ["Premium Rice", "Mustard Oil", "Green Tea", "Spices Pack", "Instant Noodles", "Organic Honey"],
  "baby-products": ["Baby Lotion", "Diaper Pack", "Feeding Bottle", "Baby Wipes", "Baby Shampoo", "Soft Toy"],
  "sports-outdoor": ["Football", "Cricket Bat", "Badminton Racket", "Backpack", "Camping Light", "Water Bottle"],
  "books-stationery": ["Notebook Set", "Gel Pen", "Planner", "Sticky Notes", "Drawing Pad", "Office File"],
  "automotive": ["Car Vacuum", "Bike Helmet", "Phone Holder", "Microfiber Cloth", "Car Charger", "Air Freshener"],
  "gaming-accessories": ["Gaming Mouse", "RGB Keyboard", "Headset", "Mouse Pad", "Controller", "Cooling Fan"],
};

const reviewComments = [
  "Quality is better than expected for the price.",
  "Delivery was fast and packaging was secure.",
  "Good value for money. I would recommend it.",
  "Product matched the description and works well.",
  "Nice design and useful for daily use.",
  "After a few days of use, performance feels reliable.",
];

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function money(value: number) {
  return value.toFixed(2);
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function productBasePrice(categorySlug: string) {
  if (["electronics", "mobile-phones", "laptops-computers", "gaming-accessories"].includes(categorySlug)) {
    return randomInt(950, 95000);
  }
  if (["fashion", "mens-clothing", "womens-clothing", "shoes", "watches"].includes(categorySlug)) {
    return randomInt(550, 8500);
  }
  if (["grocery", "books-stationery", "baby-products"].includes(categorySlug)) {
    return randomInt(120, 3500);
  }
  return randomInt(350, 25000);
}

function productImageUrl(productIndex: number, imageIndex: number) {
  // Stable demo image source. Replace with your Cloudinary/S3 URLs in production.
  return `https://picsum.photos/seed/enterfly-${productIndex}-${imageIndex}/900/900`;
}

async function resetDatabase() {
  await prisma.promoCodeUsage.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.address.deleteMany();
  await prisma.review.deleteMany();
  await prisma.inventoryLog.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.category.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.promoCode.deleteMany();
  await prisma.storeSettings.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.user.deleteMany();
}

async function seedSettings() {
  await prisma.storeSettings.create({
    data: {
      taxRate: "0.0500",
      standardShippingFee: "120.00",
      freeShippingThreshold: "50000.00",
      expressShippingFee: "250.00",
      currency: "BDT",
    },
  });
}

async function seedCategories() {
  const categories: CreatedCategory[] = [];

  for (const [name, slug] of categorySeed) {
    categories.push(
      await prisma.category.create({
        data: {
          name,
          slug,
          description: `${name} collection for EnterFly demo storefront.`,
          image: `https://picsum.photos/seed/category-${slug}/1200/600`,
          status: "ACTIVE",
        },
      }),
    );
  }

  return categories;
}

/**
 * Build `count` distinct size+color combinations for a product so the
 * `@@unique([productId, size, color])` constraint is never violated.
 */
function uniqueSizeColorCombos(count: number): { size: string; color: string }[] {
  const seen = new Set<string>();
  const combos: { size: string; color: string }[] = [];
  let guard = 0;
  while (combos.length < count && guard < 200) {
    guard += 1;
    const size = pick(sizes);
    const color = pick(colors);
    const key = `${size}|${color}`;
    if (seen.has(key)) continue;
    seen.add(key);
    combos.push({ size, color });
  }
  return combos;
}

async function seedProducts(categories: CreatedCategory[]) {
  const products: CreatedProduct[] = [];
  const variants: CreatedVariant[] = [];
  let productCounter = 1;

  for (const category of categories) {
    const words = productWords[category.slug] ?? ["Demo Product"];

    for (let i = 1; i <= CONFIG.productsPerCategory; i++) {
      const productName = `${pick(words)} ${i} - ${category.name}`;
      const productCode = `PRD-${String(productCounter).padStart(5, "0")}`;
      const productSlug = `${slugify(productName)}-${productCode.toLowerCase()}`;
      const isInactive = productCounter % 29 === 0;

      // Pricing lives on the product now.
      //   salePrice     = regular selling price
      //   buyingPrice   = source cost (55%–80% of sale price), admin-only
      //   discountPrice = optional discounted price (<= salePrice)
      const salePrice = productBasePrice(category.slug);
      const buyingPrice = Math.max(
        20,
        Math.round((salePrice * randomInt(55, 80)) / 100),
      );
      const hasDiscount = productCounter % 3 !== 0;
      const discountPrice = hasDiscount
        ? Math.max(
            buyingPrice + 10,
            salePrice - randomInt(50, Math.min(2500, Math.floor(salePrice * 0.2))),
          )
        : null;

      const product = await prisma.product.create({
        data: {
          productCode,
          name: productName,
          slug: productSlug,
          description: `Demo description for ${productName}. This item is seeded for testing listing, filtering, details, cart, checkout, review, and admin flows.`,
          status: isInactive ? "INACTIVE" : "ACTIVE",
          categoryId: category.id,
          buyingPrice: money(buyingPrice),
          salePrice: money(salePrice),
          discountPrice: discountPrice != null ? money(discountPrice) : null,
        },
      });

      products.push(product);

      for (let imageIndex = 1; imageIndex <= 3; imageIndex++) {
        await prisma.productImage.create({
          data: {
            productId: product.id,
            url: productImageUrl(productCounter, imageIndex),
            alt: `${product.name} image ${imageIndex}`,
            position: imageIndex,
          },
        });
      }

      // Distinct size+color combinations form the purchasable variants.
      const combos = uniqueSizeColorCombos(CONFIG.variantsPerProduct);
      let variantIndex = 0;
      for (const combo of combos) {
        variantIndex += 1;
        const sku = `${category.slug.slice(0, 3).toUpperCase()}-${String(productCounter).padStart(4, "0")}-V${variantIndex}`;

        const variant = await prisma.productVariant.create({
          data: {
            productId: product.id,
            size: combo.size,
            color: combo.color,
            sku,
            stock: randomInt(0, 180),
            image: productImageUrl(productCounter, variantIndex),
            isActive: true,
          },
        });

        variants.push(variant);

        await prisma.inventoryLog.create({
          data: {
            variantId: variant.id,
            type: "STOCK_IN",
            quantity: randomInt(30, 220),
            note: "Initial demo stock",
          },
        });
      }

      productCounter++;
    }
  }

  return { products, variants };
}

async function seedUsers() {
  const users: CreatedUser[] = [];
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const admin = await prisma.user.create({
    data: {
      name: "EnterFly Admin",
      email: "admin@enterfly.test",
      password: passwordHash,
      phone: "01700000001",
      city: "Dhaka",
      role: "ADMIN",
      provider: "CREDENTIAL",
      termsAcceptedAt: new Date(),
    },
  });
  users.push(admin);

  for (let i = 1; i <= CONFIG.userCount; i++) {
    const firstName = pick(firstNames);
    const lastName = pick(lastNames);
    const email = `customer${String(i).padStart(3, "0")}@enterfly.test`;

    users.push(
      await prisma.user.create({
        data: {
          name: `${firstName} ${lastName}`,
          email,
          password: i % 5 === 0 ? null : passwordHash,
          phone: `01${randomInt(3, 9)}${String(randomInt(10000000, 99999999))}`,
          city: pick(cities),
          image: `https://i.pravatar.cc/300?img=${(i % 70) + 1}`,
          role: "USER",
          provider: i % 5 === 0 ? "GOOGLE" : "CREDENTIAL",
          termsAcceptedAt: new Date(Date.now() - randomInt(1, 120) * 86400000),
        },
      }),
    );
  }

  return users;
}

async function seedAddresses(users: CreatedUser[]) {
  const addresses: CreatedAddress[] = [];
  const customers = users.filter((user) => user.role === "USER");

  for (const user of customers) {
    const addressCount = Math.random() > 0.65 ? 2 : 1;

    for (let i = 0; i < addressCount; i++) {
      const city = user.city ?? pick(cities);
      const area = pick(areas);
      addresses.push(
        await prisma.address.create({
          data: {
            userId: user.id,
            fullName: user.name,
            phone: user.phone ?? `017${randomInt(10000000, 99999999)}`,
            city,
            area,
            address: `House ${randomInt(1, 150)}, Road ${randomInt(1, 35)}, ${area}, ${city}`,
            postalCode: String(randomInt(1000, 9999)),
            isDefault: i === 0,
          },
        }),
      );
    }
  }

  return addresses;
}

async function seedPromos() {
  const now = new Date();
  const future = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 180);
  const past = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30);

  const promos: CreatedPromo[] = [];

  const data: Prisma.PromoCodeCreateInput[] = [
    {
      code: "ENTERFLY10",
      description: "10% discount for demo checkout testing",
      discountType: "PERCENT",
      value: "10.00",
      minOrder: "1000.00",
      maxDiscount: "1000.00",
      startsAt: past,
      endsAt: future,
      usageLimit: 500,
      status: "ACTIVE",
    },
    {
      code: "WELCOME200",
      description: "Flat 200 BDT discount",
      discountType: "FLAT",
      value: "200.00",
      minOrder: "1500.00",
      maxDiscount: null,
      startsAt: past,
      endsAt: future,
      usageLimit: 300,
      status: "ACTIVE",
    },
    {
      code: "FREESHIP",
      description: "Demo flat shipping support discount",
      discountType: "FLAT",
      value: "120.00",
      minOrder: "800.00",
      maxDiscount: null,
      startsAt: past,
      endsAt: future,
      usageLimit: 1000,
      status: "ACTIVE",
    },
    {
      code: "OLDDEAL",
      description: "Inactive old campaign",
      discountType: "PERCENT",
      value: "15.00",
      minOrder: "1000.00",
      maxDiscount: "800.00",
      startsAt: past,
      endsAt: past,
      usageLimit: 100,
      status: "INACTIVE",
    },
  ];

  for (const item of data) {
    promos.push(await prisma.promoCode.create({ data: item }));
  }

  return promos;
}

async function seedBanners(categories: CreatedCategory[]) {
  const carouselTitles = ["Tech Fest Sale", "Fashion Week", "Home Upgrade", "Daily Grocery Deals", "Gaming Zone"];

  for (let i = 0; i < carouselTitles.length; i++) {
    await prisma.banner.create({
      data: {
        type: "CAROUSEL",
        title: carouselTitles[i],
        subtitle: "Limited time demo campaign",
        description: "Explore hand-picked products with special offers.",
        image: `https://picsum.photos/seed/banner-carousel-${i}/1600/700`,
        link: `/products?campaign=${slugify(carouselTitles[i])}`,
        position: i + 1,
        status: "ACTIVE",
        metadata: {
          badge: i % 2 === 0 ? "Hot" : "New",
          discount: `${randomInt(10, 45)}% OFF`,
          bgFrom: "slate-900",
          bgTo: "gray-800",
        },
      },
    });
  }

  for (let i = 0; i < categories.length; i++) {
    await prisma.banner.create({
      data: {
        type: "CATEGORY",
        title: categories[i].name,
        subtitle: "Shop by category",
        image: `https://picsum.photos/seed/banner-category-${categories[i].slug}/900/500`,
        link: `/categories/${categories[i].slug}`,
        position: i + 1,
        status: i % 11 === 0 ? "INACTIVE" : "ACTIVE",
        categoryId: categories[i].id,
        metadata: {
          icon: "ShoppingBag",
          label: `${randomInt(30, 250)}+ items`,
        },
      },
    });
  }

  for (let i = 1; i <= 8; i++) {
    await prisma.banner.create({
      data: {
        type: i % 2 === 0 ? "DEAL" : "PROMO",
        title: i % 2 === 0 ? "Flash Deal" : "Promo Offer",
        subtitle: `Demo campaign ${i}`,
        description: "Perfect for homepage promotional card testing.",
        image: `https://picsum.photos/seed/banner-promo-${i}/1000/600`,
        link: "/products",
        position: i,
        status: "ACTIVE",
        metadata: {
          tag: i % 2 === 0 ? "Deal" : "Promo",
          discount: `${randomInt(5, 35)}% OFF`,
        },
      },
    });
  }

  for (let i = 1; i <= 4; i++) {
    await prisma.banner.create({
      data: {
        type: "TOP",
        title: `Top Bar Campaign ${i}`,
        subtitle: "Free delivery on selected products",
        link: "/products",
        position: i,
        status: "ACTIVE",
        metadata: {
          message: "Fast delivery inside Dhaka city",
        },
      },
    });
  }
}

async function seedWishlistsAndCarts(users: CreatedUser[], products: CreatedProduct[], variants: CreatedVariant[]) {
  const customers = users.filter((user) => user.role === "USER");
  const wishlistPairs = new Set<string>();
  const cartPairs = new Set<string>();

  let wishlistCreated = 0;
  while (wishlistCreated < CONFIG.wishlistCount) {
    const user = pick(customers);
    const product = pick(products);
    const key = `${user.id}:${product.id}`;
    if (wishlistPairs.has(key)) continue;

    wishlistPairs.add(key);
    await prisma.wishlist.create({
      data: {
        userId: user.id,
        productId: product.id,
      },
    });
    wishlistCreated++;
  }

  let cartCreated = 0;
  while (cartCreated < CONFIG.cartCount) {
    const user = pick(customers);
    const variant = pick(variants);
    const productId = variant.productId;
    const key = `${user.id}:${variant.id}`;
    if (cartPairs.has(key)) continue;

    cartPairs.add(key);
    await prisma.cartItem.create({
      data: {
        userId: user.id,
        productId,
        variantId: variant.id,
        quantity: randomInt(1, 4),
      },
    });
    cartCreated++;
  }
}

async function seedOrders(
  users: CreatedUser[],
  products: CreatedProduct[],
  variants: CreatedVariant[],
  addresses: CreatedAddress[],
  promos: CreatedPromo[],
) {
  const customers = users.filter((user) => user.role === "USER");
  const activePromos = promos.filter((promo) => promo.status === "ACTIVE");
  const productById = new Map(products.map((product) => [product.id, product]));
  const addressesByUserId = new Map<string, CreatedAddress[]>();

  for (const address of addresses) {
    const existing = addressesByUserId.get(address.userId) ?? [];
    existing.push(address);
    addressesByUserId.set(address.userId, existing);
  }

  const promoUsageCounts = new Map<string, number>();

  // Linear fulfillment pipeline used to synthesize a realistic audit
  // trail for each seeded order.
  const HAPPY_PATH = [
    "PENDING",
    "PAYMENT_CONFIRMED",
    "SELLER_TO_PACK",
    "PACKED",
    "READY_TO_SHIP",
    "WAREHOUSE",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
  ] as const;

  type SeedOrderStatus =
    | (typeof HAPPY_PATH)[number]
    | "CANCELLED"
    | "RETURN_REQUESTED"
    | "RETURNED"
    | "REFUNDED";

  // The full sequence of statuses an order passed through to reach its
  // final state — drives the OrderStatusHistory rows.
  function statusPath(final: SeedOrderStatus): SeedOrderStatus[] {
    const happyIndex = (HAPPY_PATH as readonly string[]).indexOf(final);
    if (happyIndex >= 0) {
      return HAPPY_PATH.slice(0, happyIndex + 1) as SeedOrderStatus[];
    }
    if (final === "CANCELLED") {
      return ["PENDING", "PAYMENT_CONFIRMED", "CANCELLED"];
    }
    const tail: SeedOrderStatus[] =
      final === "RETURN_REQUESTED"
        ? ["RETURN_REQUESTED"]
        : final === "RETURNED"
          ? ["RETURN_REQUESTED", "RETURNED"]
          : ["RETURN_REQUESTED", "RETURNED", "REFUNDED"];
    return [...(HAPPY_PATH as readonly SeedOrderStatus[]), ...tail];
  }

  for (let i = 1; i <= CONFIG.orderCount; i++) {
    const user = pick(customers);
    const userAddresses = addressesByUserId.get(user.id) ?? [];
    const address = userAddresses[0] ?? pick(addresses);
    const itemCount = randomInt(1, 4);
    const pickedVariants = new Map<string, CreatedVariant>();

    while (pickedVariants.size < itemCount) {
      const variant = pick(variants);
      pickedVariants.set(variant.id, variant);
    }

    const orderItemsInput: Prisma.OrderItemCreateWithoutOrderInput[] = [];
    let subtotal = 0;

    for (const variant of pickedVariants.values()) {
      const product = productById.get(variant.productId);
      if (!product) continue;

      const quantity = randomInt(1, 3);
      // Pricing comes from the product now (discount when present).
      const unit = Number(product.discountPrice ?? product.salePrice);
      const total = unit * quantity;
      subtotal += total;

      orderItemsInput.push({
        product: { connect: { id: product.id } },
        variant: { connect: { id: variant.id } },
        productName: product.name,
        productImage: productImageUrl(Number(product.productCode.replace("PRD-", "")), 1),
        sku: variant.sku,
        color: variant.color,
        size: variant.size,
        quantity,
        unitPrice: money(unit),
        totalPrice: money(total),
        buyingPrice: money(Number(product.buyingPrice)),
      });
    }

    const deliveryCharge = subtotal >= 50000 ? 0 : pick([80, 120, 150, 250]);
    const taxAmount = Math.round(subtotal * 0.05);
    const usePromo = i % 4 === 0;
    const promo = usePromo ? pick(activePromos) : null;
    let discountAmount = 0;

    if (promo) {
      if (promo.discountType === "PERCENT") {
        const rawDiscount = subtotal * (Number(promo.value) / 100);
        discountAmount = promo.maxDiscount ? Math.min(rawDiscount, Number(promo.maxDiscount)) : rawDiscount;
      } else {
        discountAmount = Number(promo.value);
      }
      discountAmount = Math.min(discountAmount, subtotal);
    }

    const totalAmount = subtotal + deliveryCharge + taxAmount - discountAmount;
    const status = pick([
      "PENDING",
      "PAYMENT_CONFIRMED",
      "SELLER_TO_PACK",
      "PACKED",
      "READY_TO_SHIP",
      "WAREHOUSE",
      "IN_TRANSIT",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "DELIVERED",
      "DELIVERED",
      "CANCELLED",
      "RETURN_REQUESTED",
      "RETURNED",
      "REFUNDED",
    ] as const) as SeedOrderStatus;
    const paymentMethod = i % 7 === 0 ? "ONLINE" : "CASH_ON_DELIVERY";
    // Anything past payment confirmation has, by definition, been paid.
    const paidByLifecycle =
      status !== "PENDING" && status !== "CANCELLED";
    const paymentStatus =
      status === "CANCELLED"
        ? "UNPAID"
        : paidByLifecycle || (paymentMethod === "ONLINE" && i % 3 !== 0)
          ? "PAID"
          : "UNPAID";

    // Build the timestamped audit trail. The order "started" a random
    // number of days ago and each subsequent step advances by a few
    // hours so the tracker shows a believable progression.
    const path = statusPath(status);
    const startedAt = new Date(
      Date.now() - randomInt(1, 25) * 24 * 60 * 60 * 1000,
    );
    const historyRows = path.map((stepStatus, stepIndex) => ({
      status: stepStatus as Prisma.OrderStatusHistoryCreateManyOrderInput["status"],
      createdAt: new Date(startedAt.getTime() + stepIndex * 8 * 60 * 60 * 1000),
      note:
        stepIndex === 0
          ? "Order placed."
          : stepStatus === "CANCELLED"
            ? "Order cancelled."
            : null,
      updatedBy: stepIndex === 0 ? user.id : null,
    }));
    const orderCreatedAt = startedAt;

    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${new Date().getFullYear().toString().slice(2)}-${String(i).padStart(6, "0")}`,
        userId: user.id,
        subtotal: money(subtotal),
        deliveryCharge: money(deliveryCharge),
        discountAmount: money(discountAmount),
        taxAmount: money(taxAmount),
        totalAmount: money(totalAmount),
        customerName: address.fullName,
        customerPhone: address.phone,
        customerAddress: address.address,
        customerEmail: user.email,
        customerCity: address.city,
        customerArea: address.area,
        customerPostalCode: address.postalCode,
        customerNote: i % 5 === 0 ? "Please call before delivery." : null,
        promoCode: promo?.code ?? null,
        status,
        paymentMethod,
        paymentStatus,
        createdAt: orderCreatedAt,
        items: {
          create: orderItemsInput,
        },
        statusHistory: {
          create: historyRows,
        },
      },
      include: { items: true },
    });

    await prisma.paymentTransaction.create({
      data: {
        orderId: order.id,
        provider: paymentMethod === "ONLINE" ? "SSLCommerz Demo" : "COD",
        transactionId: paymentMethod === "ONLINE" ? `TXN-${String(i).padStart(8, "0")}` : null,
        amount: money(totalAmount),
        currency: "BDT",
        status: paymentStatus === "PAID" ? "SUCCESS" : status === "CANCELLED" ? "CANCELLED" : status === "REFUNDED" ? "REFUNDED" : "PENDING",
        rawResponse: {
          seeded: true,
          orderNumber: order.orderNumber,
          paymentMethod,
        },
      },
    });

    if (promo) {
      await prisma.promoCodeUsage.create({
        data: {
          promoCodeId: promo.id,
          userId: user.id,
          orderId: order.id,
        },
      });
      promoUsageCounts.set(promo.id, (promoUsageCounts.get(promo.id) ?? 0) + 1);
    }

    for (const item of order.items) {
      if (!item.variantId) continue;
      await prisma.inventoryLog.create({
        data: {
          variantId: item.variantId,
          type: status === "CANCELLED" ? "ORDER_CANCELLED" : "ORDER_PLACED",
          quantity: item.quantity,
          note: `${status} order ${order.orderNumber}`,
        },
      });
    }
  }

  for (const [promoCodeId, usedCount] of promoUsageCounts) {
    await prisma.promoCode.update({ where: { id: promoCodeId }, data: { usedCount } });
  }
}

async function seedReviews(users: CreatedUser[], products: CreatedProduct[]) {
  const customers = users.filter((user) => user.role === "USER");
  const reviewPairs = new Set<string>();

  // Customer reviews: one user per product due to @@unique([userId, productId])
  for (const product of products) {
    const count = randomInt(2, 5);

    for (let i = 0; i < count; i++) {
      const user = pick(customers);
      const key = `${user.id}:${product.id}`;
      if (reviewPairs.has(key)) continue;
      reviewPairs.add(key);

      await prisma.review.create({
        data: {
          productId: product.id,
          userId: user.id,
          authorName: user.name,
          rating: randomInt(3, 5),
          title: pick(["Good product", "Worth buying", "Satisfied", "Nice quality", "Recommended"]),
          comment: pick(reviewComments),
          source: "CUSTOMER",
          verified: Math.random() > 0.25,
        },
      });
    }

    // Admin/marketing reviews: userId null allows multiple rows in Postgres.
    if (Math.random() > 0.35) {
      await prisma.review.create({
        data: {
          productId: product.id,
          userId: null,
          authorName: `${pick(firstNames)} ${pick(lastNames)}`,
          rating: randomInt(4, 5),
          title: "Admin curated feedback",
          comment: "Seeded review for storefront rating and review UI testing.",
          source: "ADMIN",
          verified: false,
        },
      });
    }
  }
}

async function seedTestimonials() {
  const texts = [
    "EnterFly made online shopping simple and reliable for my family.",
    "The checkout flow is smooth and delivery updates are easy to follow.",
    "Great collection, fair pricing, and clean customer support experience.",
    "I like how quickly I can find products and compare options.",
    "The packaging quality and order summary experience felt professional.",
  ];

  for (let i = 1; i <= 18; i++) {
    await prisma.testimonial.create({
      data: {
        name: `${pick(firstNames)} ${pick(lastNames)}`,
        location: `${pick(areas)}, ${pick(cities)}`,
        image: `https://i.pravatar.cc/300?img=${(i % 70) + 1}`,
        rating: randomInt(4, 5),
        text: pick(texts),
        position: i,
        status: i % 9 === 0 ? "INACTIVE" : "ACTIVE",
      },
    });
  }
}

async function seedContactMessages() {
  const subjects = ["Order question", "Product availability", "Return request", "Bulk order", "Payment issue", "Delivery update"];

  for (let i = 1; i <= CONFIG.contactMessageCount; i++) {
    await prisma.contactMessage.create({
      data: {
        name: `${pick(firstNames)} ${pick(lastNames)}`,
        email: `message${String(i).padStart(3, "0")}@example.com`,
        phone: `01${randomInt(3, 9)}${String(randomInt(10000000, 99999999))}`,
        subject: pick(subjects),
        message: "This is a seeded contact message for testing the admin inbox workflow.",
        status: pick(["NEW", "READ", "ARCHIVED"] as const),
      },
    });
  }
}

async function main() {
  console.time("Seed completed");
  console.log("Resetting database...");
  await resetDatabase();

  console.log("Seeding settings...");
  await seedSettings();

  console.log("Seeding categories...");
  const categories = await seedCategories();

  console.log("Seeding products, variants, images, and stock logs...");
  const { products, variants } = await seedProducts(categories);

  console.log("Seeding users and addresses...");
  const users = await seedUsers();
  const addresses = await seedAddresses(users);

  console.log("Seeding promo codes and banners...");
  const promos = await seedPromos();
  await seedBanners(categories);

  console.log("Seeding wishlists and carts...");
  await seedWishlistsAndCarts(users, products, variants);

  console.log("Seeding orders, order items, payments, promo usages, and inventory movements...");
  await seedOrders(users, products, variants, addresses, promos);

  console.log("Seeding reviews, testimonials, and contact messages...");
  await seedReviews(users, products);
  await seedTestimonials();
  await seedContactMessages();

  const summary = {
    users: await prisma.user.count(),
    categories: await prisma.category.count(),
    products: await prisma.product.count(),
    variants: await prisma.productVariant.count(),
    productImages: await prisma.productImage.count(),
    cartItems: await prisma.cartItem.count(),
    wishlistItems: await prisma.wishlist.count(),
    orders: await prisma.order.count(),
    orderItems: await prisma.orderItem.count(),
    reviews: await prisma.review.count(),
    banners: await prisma.banner.count(),
    promoCodes: await prisma.promoCode.count(),
    promoCodeUsages: await prisma.promoCodeUsage.count(),
    inventoryLogs: await prisma.inventoryLog.count(),
    testimonials: await prisma.testimonial.count(),
    contactMessages: await prisma.contactMessage.count(),
  };

  console.table(summary);
  console.log(`Demo login: admin@enterfly.test / ${PASSWORD}`);
  console.log(`Demo customer: customer001@enterfly.test / ${PASSWORD}`);
  console.timeEnd("Seed completed");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
