import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import ProductCard from "@/components/product/ProductCard";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, collectionPageJsonLd } from "@/lib/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";
import { siteConfig } from "@/lib/seo/site";
import {
  getActiveCategoryBySlug,
  type PublicCategoryProduct,
} from "@/lib/services/category.service";

type Props = {
  params: Promise<{ slug: string }>;
};

const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getActiveCategoryBySlug(slug);

  if (!category) {
    return buildMetadata({
      title: "Category Not Found",
      description: "The requested category could not be found.",
      path: `/categories/${slug}`,
      index: false,
    });
  }

  const description =
    category.description?.trim() ||
    `Shop ${category.name} at ${siteConfig.name}. Browse ${category.products.length} products in ${category.name} with secure checkout and fast delivery.`;

  return buildMetadata({
    title: `${category.name} - Shop ${category.name} Online`,
    description,
    path: `/categories/${category.slug}`,
    image: category.image,
    keywords: [category.name, `buy ${category.name}`, "category", siteConfig.name],
  });
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await getActiveCategoryBySlug(slug);

  if (!category) notFound();

  const collectionSchema = collectionPageJsonLd({
    name: category.name,
    description: category.description,
    path: `/categories/${category.slug}`,
  });
  const breadcrumbSchema = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    { name: category.name, path: `/categories/${category.slug}` },
  ]);

  return (
    <div className="min-h-screen bg-linear-to-b from-[#F5F3FF] via-white to-white">
      <JsonLd data={[collectionSchema, breadcrumbSchema]} />

      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8 lg:px-6">
        {/* Breadcrumb trail */}
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-gray-500">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-violet-700">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/products" className="hover:text-violet-700">
                Products
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="font-medium text-gray-800">{category.name}</li>
          </ol>
        </nav>

        <header className="mb-6">
          <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
            {category.name}
          </h1>
          {category.description ? (
            <p className="mt-2 max-w-2xl text-sm text-gray-600 sm:text-base">
              {category.description}
            </p>
          ) : (
            <p className="mt-2 text-sm text-gray-600">
              {category.products.length}{" "}
              {category.products.length === 1 ? "product" : "products"} available
            </p>
          )}
        </header>

        {category.products.length === 0 ? (
          <div className="rounded-2xl border border-violet-100 bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">No products yet</h2>
            <p className="mt-2 text-sm text-gray-600">
              There are no products in this category right now. Check back soon.
            </p>
            <Link
              href="/products"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-linear-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5"
            >
              Browse all products
            </Link>
          </div>
        ) : (
          <section aria-label={`${category.name} products`}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {category.products.map((product: PublicCategoryProduct) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  slug={product.slug}
                  name={product.name}
                  price={product.discountPrice ?? product.price}
                  originalPrice={
                    product.discountPrice != null ? product.price : undefined
                  }
                  image={product.image ?? FALLBACK_PRODUCT_IMAGE}
                  variantCount={product.variantCount}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
