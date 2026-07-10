'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { Check } from 'lucide-react'

const FALLBACK_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'
const FALLBACK_PRODUCT_IMAGES = [FALLBACK_PRODUCT_IMAGE]

const ProductGallery = ({
  images,
  productName,
  selectedVariantImage,
}: {
  images: string[]
  productName: string
  selectedVariantImage?: string | null
}) => {
  const activeImages = images.length > 0 ? images : FALLBACK_PRODUCT_IMAGES
  const [manualSelection, setManualSelection] = useState<{
    index: number
    variantImage: string | null
  }>({ index: 0, variantImage: null })
  const selectedVariantImageIndex = useMemo(
    () =>
      selectedVariantImage
        ? activeImages.findIndex((image) => image === selectedVariantImage)
        : -1,
    [activeImages, selectedVariantImage],
  )
  const variantSelectionChanged =
    selectedVariantImageIndex >= 0 &&
    manualSelection.variantImage !== selectedVariantImage
  const selectedImage = variantSelectionChanged
    ? selectedVariantImageIndex
    : Math.min(manualSelection.index, activeImages.length - 1)

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="relative aspect-4/5 bg-white rounded-2xl overflow-hidden border border-gray-100">
        <Image
          src={activeImages[selectedImage]}
          alt={`${productName} - Image ${selectedImage + 1}`}
          fill
          className="object-contain p-4"
        />
        {selectedVariantImageIndex === selectedImage && (
          <span
            className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-white shadow-sm ring-2 ring-white"
            aria-label="Selected variant image"
            title="Selected variant image"
          >
            <Check className="h-4 w-4" />
          </span>
        )}
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {activeImages.map((image, index) => {
          const isVariantImage = selectedVariantImageIndex === index

          return (
            <button
              key={`${image}-${index}`}
              onClick={() =>
                setManualSelection({
                  index,
                  variantImage: selectedVariantImage ?? null,
                })
              }
              className={`relative aspect-4/5 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                selectedImage === index
                  ? 'border-violet-500'
                  : 'border-gray-200 hover:border-violet-300'
              }`}
              aria-label={
                isVariantImage
                  ? `View selected variant image ${index + 1}`
                  : `View product image ${index + 1}`
              }
              title={isVariantImage ? 'Selected variant image' : `Image ${index + 1}`}
            >
              <Image
                src={image}
                alt={`Thumbnail ${index + 1}`}
                fill
                className="object-cover"
              />
              {isVariantImage && (
                <span className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-white shadow-sm ring-1 ring-white">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default ProductGallery
