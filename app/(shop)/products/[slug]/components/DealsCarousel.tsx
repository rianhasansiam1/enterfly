'use client'

import React, { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { resolveColorValue } from '@/components/ui/tailwind-palette'

type DealBanner = {
  id: string
  image: string
  title: string
  subtitle: string
  bgClass: string
  link: string | null
}

type DealsCarouselProps = {
  deals: DealBanner[]
  title?: string
}

const DealsCarousel: React.FC<DealsCarouselProps> = ({ 
  deals, 
  title = 'Black Friday Deals' 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 280
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  if (!deals || deals.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => scroll('left')}
            className="p-2 rounded-full border border-gray-200 hover:bg-violet-50 hover:border-violet-300 transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button 
            onClick={() => scroll('right')}
            className="p-2 rounded-full border border-gray-200 hover:bg-violet-50 hover:border-violet-300 transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory"
      >
        {deals.map((deal) => (
          <Link
            key={deal.id}
            href={deal.link ?? "#"}
            style={{ backgroundColor: resolveColorValue(deal.bgClass) ?? "#f43f5e" }}
            className="relative min-w-[180px] h-24 rounded-xl overflow-hidden shrink-0 snap-start group"
          >
            <Image
              src={deal.image}
              alt={deal.title}
              fill
              className="object-cover opacity-60 group-hover:scale-105 transition-transform"
              sizes="180px"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-2">
              <p className="text-xs font-semibold opacity-90">{deal.subtitle}</p>
              <h3 className="text-lg font-black">{deal.title}</h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default DealsCarousel
