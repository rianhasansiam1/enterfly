"use client";

import { useCallback, useMemo, useState } from "react";

import ProductActions, { type ProductVariantOption } from "./ProductActions";
import ProductGallery from "./ProductGallery";
import ProductInfo from "./ProductInfo";

function uniqueImageList(images: string[], variants: ProductVariantOption[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  const addImage = (url: string | null | undefined) => {
    const trimmed = url?.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    result.push(trimmed);
  };

  images.forEach(addImage);
  variants.forEach((variant) => addImage(variant.image));

  return result;
}

export default function ProductPurchaseSection({
  productId,
  productName,
  productCode,
  galleryImages,
  salePrice,
  discountPrice,
  variants,
}: {
  productId: string;
  productName: string;
  productCode?: string | null;
  galleryImages: string[];
  salePrice: number;
  discountPrice: number | null;
  variants: ProductVariantOption[];
}) {
  const mergedGalleryImages = useMemo(
    () => uniqueImageList(galleryImages, variants),
    [galleryImages, variants],
  );
  const initialVariant = useMemo(
    () => variants.find((variant) => variant.stock > 0) ?? variants[0] ?? null,
    [variants],
  );
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    initialVariant?.id ?? null,
  );
  const selectedVariant =
    variants.find((variant) => variant.id === selectedVariantId) ?? initialVariant;

  const handleVariantChange = useCallback(
    (variant: ProductVariantOption | null) => {
      setSelectedVariantId(variant?.id ?? null);
    },
    [],
  );

  const primaryImage = mergedGalleryImages[0] ?? galleryImages[0] ?? null;

  return (
    <>
      <div className="md:col-span-6 lg:col-span-4">
        <ProductGallery
          images={mergedGalleryImages}
          productName={productName}
          selectedVariantImage={selectedVariant?.image ?? null}
        />
      </div>

      <div className="md:col-span-6 lg:col-span-5">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-6">
          <ProductInfo
            name={productName}
            specs={[]}
            deliveryTime="2 Hours"
            productCode={productCode}
          />

          <ProductActions
            productId={productId}
            productName={productName}
            image={primaryImage}
            salePrice={salePrice}
            discountPrice={discountPrice}
            variants={variants}
            onVariantChange={handleVariantChange}
          />
        </div>
      </div>
    </>
  );
}
