'use client'

import React, { useState } from 'react'
import Image from 'next/image'

const ProductGallery = ({
  images,
  productName,
}: {
  images: string[]
  productName: string
}) => {
  const [selectedImage, setSelectedImage] = useState(0)

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="relative aspect-square bg-white rounded-2xl overflow-hidden border border-gray-100">
        <Image
          src={images[selectedImage]}
          alt={`${productName} - Image ${selectedImage + 1}`}
          fill
          className="object-contain p-4"
        />
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedImage(index)}
            className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
              selectedImage === index
                ? 'border-violet-500'
                : 'border-gray-200 hover:border-violet-300'
            }`}
          >
            <Image
              src={image}
              alt={`Thumbnail ${index + 1}`}
              fill
              className="object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export default ProductGallery
