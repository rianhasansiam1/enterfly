import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import {
  getActiveDealBanners,
  getActivePromoBanners,
} from "@/lib/services/banner.service";
import {
  getActiveProductBySlug,
  getProductBySlug,
  getProductSlugById,
  listProducts,
  type ProductWithCategory,
} from "@/lib/services/product.service";
import JsonLd from "@/components/seo/JsonLd";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/seo/json-ld";
import { siteConfig } from "@/lib/seo/site";

import Breadcrumbs from "./components/Breadcrumbs";
import DealsCarousel from "./components/DealsCarousel";

import ProductActions from "./components/ProductActions";
import ProductGallery from "./components/ProductGallery";
import ProductInfo from "./components/ProductInfo";
import ProductTabs from "./components/ProductTabs";
import PromoBanners from "./components/PromoBanners";
import RecentProducts from "./components/RecentProducts";
import RelatedProducts from "./components/RelatedProducts";
import ReviewSection from "./components/ReviewSection";

const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400";

type Props = {
  params: Promise<{ slug: string }>;
};

type ProductImage = ProductWithCategory["images"][number];
type ProductVariant = ProductWithCategory["variants"][number];

/** Resolve effective customer price (discount when valid) from the product. */
function effectivePrice(product: {
  salePrice: { toNumber(): number };
  discountPrice: { toNumber(): number } | null;
}) {
  const sale = product.salePrice.toNumber();
  const discount = product.discountPrice?.toNumber() ?? null;
  return discount != null && discount < sale ? discount : sale;
}

/** Regular sale price (before discount) from the product. */
function listPrice(product: { salePrice: { toNumber(): number } }) {
  return product.salePrice.toNumber();
}

function discountPercent(price: number, originalPrice: number) {
  if (originalPrice <= 0 || originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  // Only ACTIVE products get rich, indexable metadata. Inactive or
  // missing products are marked noindex so they never surface in search.
  const product = await getActiveProductBySlug(slug);

  if (!product) {
    return buildMetadata({
      title: "Product Not Found",
      description: "The requested product could not be found.",
      path: `/products/${slug}`,
      index: false,
    });
  }

  const price = effectivePrice(product);
  const description =
    product.description?.trim() ||
    `Buy ${product.name} in ${product.category.name} at ${siteConfig.name}. Price BDT ${price.toLocaleString()}. Secure checkout and fast delivery.`;

  return buildMetadata({
    title: product.name,
    description,
    path: `/products/${product.slug}`,
    image: product.images[0]?.url ?? null,
    keywords: [
      product.name,
      product.category.name,
      "buy online",
      siteConfig.name,
    ],
  });
}

export default async function ProductDetailsPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  // Backward compatibility: older links (cart, wishlist, orders, shared
  // URLs) reference a product by its cuid id. If the slug lookup misses,
  // try treating the param as an id and 308-redirect to the canonical
  // slug URL so the clean URL becomes the single source of truth.
  if (!product) {
    const canonicalSlug = await getProductSlugById(slug);
    if (canonicalSlug && canonicalSlug !== slug) {
      redirect(`/products/${canonicalSlug}`);
    }
    notFound();
  }

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

  const others = relatedRows.filter(
    (row: ProductWithCategory) => row.id !== product.id,
  );

  const toCard = (row: (typeof others)[number]) => {
    const cardPrice = effectivePrice(row);
    const cardOriginal = listPrice(row);
    return {
      id: row.id,
      slug: row.slug,
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
      ? product.images.map((img: ProductImage) => img.url)
      : [FALLBACK_PRODUCT_IMAGE];

  const breadcrumbItems = [
    {
      label: product.category.name,
      href: `/categories/${product.category.slug}`,
    },
    { label: product.name },
  ];

  // Structured data: only emit for publicly visible (ACTIVE) products so
  // crawlers never see schema for hidden/soft-deleted items. SKU comes
  // from the primary variant when present; brand/ratings are omitted
  // because EnterFly has no real data for them yet.
  const isPublic = product.status === "ACTIVE";
  const primarySku = product.variants[0]?.sku ?? null;
  const productSchema = isPublic
    ? productJsonLd({
        name: product.name,
        description: product.description,
        images:
          product.images.length > 0
            ? product.images.map((img: ProductImage) => img.url)
            : [FALLBACK_PRODUCT_IMAGE],
        path: `/products/${product.slug}`,
        price: effectivePrice(product),
        inStock: product.variants.some((v: ProductVariant) => v.stock > 0),
        category: product.category.name,
        sku: primarySku,
      })
    : null;
  const breadcrumbSchema = isPublic
    ? breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Products", path: "/products" },
        {
          name: product.category.name,
          path: `/categories/${product.category.slug}`,
        },
        { name: product.name, path: `/products/${product.slug}` },
      ])
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {productSchema && breadcrumbSchema && (
        <JsonLd data={[productSchema, breadcrumbSchema]} />
      )}
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
                productCode={product.productCode}
              />

              <ProductActions
                productId={product.id}
                productName={product.name}
                image={galleryImages[0]}
                salePrice={product.salePrice.toNumber()}
                discountPrice={
                  product.discountPrice != null
                    ? product.discountPrice.toNumber()
                    : null
                }
                variants={product.variants.map((v: ProductVariant) => ({
                  id: v.id,
                  sku: v.sku,
                  color: v.color,
                  size: v.size,
                  stock: v.stock,
                }))}
              />
            </div>
          </div>

          <div className="md:col-span-12 lg:col-span-3">
            <RecentProducts products={recentProducts} title="Recent Product" />
          </div>
        </div>

        {product.description?.trim() && (
          <div className="mt-10">
            <ProductTabs description={product.description} />
          </div>
        )}

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
