import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  getProductById,
  listProducts,
} from "@/lib/services/product.service";

import Breadcrumbs from "./components/Breadcrumbs";
import DealsCarousel from "./components/DealsCarousel";
import NearbyDealsCard from "./components/NearbyDealsCard";
import ProductActions from "./components/ProductActions";
import ProductGallery from "./components/ProductGallery";
import ProductInfo from "./components/ProductInfo";
import PromoBanners from "./components/PromoBanners";
import RecentProducts from "./components/RecentProducts";
import RelatedProducts from "./components/RelatedProducts";
import { DEAL_BANNERS, PROMO_BANNERS } from "./components/banners";

const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400";

type Props = {
  params: Promise<{ id: string }>;
};

/** Resolve effective price (discount when valid). */
function effectivePrice(product: {
  price: number;
  discountPrice: number | null;
}) {
  return product.discountPrice != null && product.discountPrice < product.price
    ? product.discountPrice
    : product.price;
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
  const ogImages = [product.image ?? FALLBACK_PRODUCT_IMAGE];

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

  const price = effectivePrice(product);
  const originalPrice = product.price;
  const discount = discountPercent(price, originalPrice);

  // Pull a generous batch from the same category so we can split it into
  // recent + related without hitting the DB twice.
  const { items: relatedRows } = await listProducts({
    page: 1,
    pageSize: 24,
    categoryId: product.categoryId,
    status: "ACTIVE",
    sort: "latest",
  });

  const others = relatedRows.filter((row) => row.id !== product.id);

  const toCard = (row: (typeof others)[number]) => {
    const cardPrice = effectivePrice(row);
    return {
      id: row.id,
      name: row.name,
      image: row.image ?? FALLBACK_PRODUCT_IMAGE,
      price: cardPrice,
      originalPrice: row.price,
      discount: discountPercent(cardPrice, row.price),
    };
  };

  const recentProducts = others.slice(0, 6).map(toCard);
  const relatedProducts = others.slice(0, 16).map(toCard);

  const galleryImages =
    product.images.length > 0
      ? product.images
      : [product.image ?? FALLBACK_PRODUCT_IMAGE];

  const breadcrumbItems = [
    {
      label: product.category.name,
      href: `/products?category=${product.category.id}`,
    },
    { label: product.name },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <ProductGallery images={galleryImages} productName={product.name} />

            <div className="mt-4">
              <NearbyDealsCard size="lg" />
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <ProductInfo
                name={product.name}
                price={price}
                originalPrice={originalPrice}
                discount={discount}
                specs={[]}
                deliveryTime="2 Hours"
              />

              <ProductActions
                productId={product.id}
                productName={product.name}
                price={price}
                inStock={product.status === "ACTIVE" && product.stock > 0}
                stockCount={product.stock}
              />
            </div>
          </div>

          <div className="lg:col-span-3">
            <RecentProducts products={recentProducts} title="Recent Product" />
          </div>
        </div>

        <div className="mt-6 lg:hidden">
          <NearbyDealsCard size="sm" />
        </div>

        <div className="mt-10">
          <DealsCarousel deals={DEAL_BANNERS} title="Black Friday Deals" />
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
          <div className="lg:col-span-9">
            <RelatedProducts
              products={relatedProducts}
              title="More Relevant Products"
            />
          </div>

          <div className="lg:col-span-3">
            <PromoBanners banners={PROMO_BANNERS} />
          </div>
        </div>
      </div>
    </div>
  );
}
