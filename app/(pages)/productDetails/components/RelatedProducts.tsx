'use client'

import React, { useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingBag, Loader2 } from 'lucide-react'

type RecentProductItem = {
  id: number
  name: string
  image: string
  price: number
  originalPrice: number
  discount: number
}

type RelatedProductsProps = {
  products: RecentProductItem[]
  title?: string
}

const ITEMS_PER_PAGE = 12
const ITEMS_PER_LOAD = 8

const RelatedProducts: React.FC<RelatedProductsProps> = ({
  products,
  title = 'More Relevant Product',
}) => {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE)
  const [isLoading, setIsLoading] = useState(false)

  const handleLoadMore = useCallback(() => {
    setIsLoading(true)
    // Simulate network delay for better UX
    setTimeout(() => {
      setVisibleCount((prev) => prev + ITEMS_PER_LOAD)
      setIsLoading(false)
    }, 500)
  }, [])

  const handleAddToBag = useCallback((e: React.MouseEvent, productId: number) => {
    e.preventDefault()
    e.stopPropagation()
    // TODO: Implement add to cart functionality
    console.log('Add to bag:', productId)
  }, [])

  if (!products || products.length === 0) {
    return null
  }

  const visibleProducts = products.slice(0, visibleCount)
  const hasMore = visibleCount < products.length

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-violet-600">
        {title}
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {visibleProducts.map((product) => (
          <Link
            key={product.id}
            href={`/productDetails/${product.id}`}
            className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-violet-200 transition-all"
          >
            {/* Image Container */}
            <div className="relative aspect-square bg-gray-50 p-2">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-contain p-2 group-hover:scale-105 transition-transform"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
              />

              {/* Discount Badge */}
              {product.discount > 0 && (
                <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-semibold rounded">
                  -{product.discount}%
                </span>
              )}
            </div>

            {/* Product Info */}
            <div className="p-3">
              {/* Delivery Time */}
              <p className="text-[10px] text-gray-400 mb-1">Delivery 2 Hours</p>
              
              {/* Price */}
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-sm font-bold text-gray-900">
                  {product.price.toLocaleString()} bdt
                </span>
                {product.discount > 0 && (
                  <span className="text-[10px] text-gray-400 line-through">
                    {product.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Product Name */}
              <h3 className="text-xs text-gray-700 line-clamp-1 mb-3">
                {product.name}
              </h3>

              {/* Add to Bag Button */}
              <button 
                onClick={(e) => handleAddToBag(e, product.id)}
                className="w-full py-1.5 bg-violet-600 text-white text-xs font-medium rounded-lg hover:bg-violet-700 transition-colors flex items-center justify-center gap-1"
              >
                <ShoppingBag className="w-3 h-3" />
                Add to bag
              </button>
            </div>
          </Link>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center pt-4">
          <button 
            onClick={handleLoadMore}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-8 py-2.5 bg-white border-2 border-gray-200 text-gray-700 font-medium rounded-lg hover:border-violet-300 hover:bg-violet-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}
    </div>
  )
}

export default RelatedProducts
