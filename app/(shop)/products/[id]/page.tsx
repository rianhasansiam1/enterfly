import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  getActiveDealBanners,
  getActivePromoBanners,
} from "@/lib/services/banner.service";
import {
  getProductById,
  listProducts,
} from "@/lib/services/product.service";

import Breadcrumbs from "./components/Breadcrumbs";
import DealsCarousel from "./components/DealsCarousel";

import ProductActions from "./components/ProductActions";
import ProductGallery from "./components/ProductGallery";
import ProductInfo from "./components/ProductInfo";
import PromoBanners from "./components/PromoBanners";
import RecentProducts from "./components/RecentProducts";
import RelatedProducts from "./components/RelatedProducts";
import ReviewSection from "./components/ReviewSection";

const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400";

type Props = {
  params: Promise<{ id: string }>;
};

/** Resolve effective price (sale price when valid) from the primary variant. */
function effectivePrice(product: {
  variants: { price: { toNumber(): number }; salePrice: { toNumber(): number } | null }[];
}) {
  const variant = product.variants[0];
  if (!variant) return 0;
  const price = variant.price.toNumber();
  const sale = variant.salePrice?.toNumber() ?? null;
  return sale != null && sale < price ? sale : price;
}

/** List price (before discount) from the primary variant. */
function listPrice(product: {
  variants: { price: { toNumber(): number } }[];
}) {
  return product.variants[0]?.price.toNumber() ?? 0;
}

function discountPercent(price: number, originalPrice: number) {
  if (originalPrice <= 0 || originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return {
      title: "Product Not Found | EnterFly",
      description: "The requested product could not be found.",
    };
  }

  const description = (product.description ?? product.name).slice(0, 160);
  const ogImages = [product.images[0]?.url ?? FALLBACK_PRODUCT_IMAGE];

  return {
    title: `${product.name} | EnterFly - Local Marketplace`,
    description,
    keywords: [product.name, product.category.name, "local shopping", "EnterFly"],
    openGraph: {
      title: `${product.name} | EnterFly`,
      description,
      type: "website",
      images: ogImages,
    },
    robots: { index: true, follow: true },
  };
}

export default async function ProductDetailsPage({ params }: Props) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  // Pull a generous batch from the same category so we can split it into
  // recent + related without hitting the DB twice. Banners come from
  // their own cached services so a marketing change shows up here on the
  // next request without a full deploy.
  const [{ items: relatedRows }, dealBanners, promoBanners] = await Promise.all([
    listProducts({
      page: 1,
      pageSize: 24,
      categoryId: product.categoryId,
      status: "ACTIVE",
      sort: "latest",
    }),
    getActiveDealBanners(),
    getActivePromoBanners(),
  ]);

  const others = relatedRows.filter((row) => row.id !== product.id);

  const toCard = (row: (typeof others)[number]) => {
    const cardPrice = effectivePrice(row);
    const cardOriginal = listPrice(row);
    return {
      id: row.id,
      name: row.name,
      image: row.images[0]?.url ?? FALLBACK_PRODUCT_IMAGE,
      price: cardPrice,
      originalPrice: cardOriginal,
      discount: discountPercent(cardPrice, cardOriginal),
    };
  };

  const recentProducts = others.slice(0, 6).map(toCard);
  const relatedProducts = others.slice(0, 16).map(toCard);

  const galleryImages =
    product.images.length > 0
      ? product.images.map((img) => img.url)
      : [FALLBACK_PRODUCT_IMAGE];

  const breadcrumbItems = [
    {
      label: product.category.name,
      href: `/products?category=${product.category.id}`,
    },
    { label: product.name },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 py-6 sm:px-4 lg:px-6">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-6 lg:col-span-4">
            <ProductGallery images={galleryImages} productName={product.name} />

           
          </div>

          <div className="md:col-span-6 lg:col-span-5">
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100">
              <ProductInfo
                name={product.name}
                specs={[]}
                deliveryTime="2 Hours"
              />

              <ProductActions
                productId={product.id}
                productName={product.name}
                image={galleryImages[0]}
                variants={product.variants.map((v) => ({
                  id: v.id,
                  sku: v.sku,
                  color: v.color,
                  size: v.size,
                  price: v.price.toNumber(),
                  salePrice: v.salePrice != null ? v.salePrice.toNumber() : null,
                  stock: v.stock,
                }))}
              />
            </div>
          </div>

          <div className="md:col-span-12 lg:col-span-3">
            <RecentProducts products={recentProducts} title="Recent Product" />
          </div>
        </div>

        

        <div className="mt-10">
          <DealsCarousel deals={dealBanners} title="Black Friday Deals" />
        </div>

        <div className="mt-10" id="reviews">
          <ReviewSection productId={product.id} />
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
          <div className="lg:col-span-9">
            <RelatedProducts
              products={relatedProducts}
              title="More Relevant Products"
            />
          </div>

          <div className="lg:col-span-3">
            <PromoBanners banners={promoBanners} />
          </div>
        </div>
      </div>
    </div>
  );
}
