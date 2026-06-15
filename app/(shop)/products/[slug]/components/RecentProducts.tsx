'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

type RecentProductItem = {
  id: string
  slug: string
  name: string
  image: string
  price: number
  originalPrice: number
  discount: number
}

type RecentProductsProps = {
  products: RecentProductItem[]
  title?: string
}

const RecentProducts: React.FC<RecentProductsProps> = ({ 
  products, 
  title = 'Recent Product' 
}) => {
  if (!products || products.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
      
      <div className="space-y-3">
        {products.slice(0, 6).map((product) => (
          <Link 
            key={product.id}
            href={`/products/${product.slug}`}
            className="flex gap-3 p-2 rounded-xl hover:bg-violet-50 transition-colors group"
          >
            {/* Thumbnail */}
            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-violet-700 transition-colors">
                {product.name}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-bold text-violet-700">
                  {product.price.toLocaleString()} bdt
                </span>
                {product.discount > 0 && (
                  <span className="text-xs text-gray-400 line-through">
                    {product.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default RecentProducts
