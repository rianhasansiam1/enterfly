'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { resolveColorValue } from '@/components/ui/tailwind-palette'

type PromoBanner = {
  id: string
  image: string
  title: string
  subtitle: string
  discount: string
  bgClass: string
  link: string | null
}

type PromoBannersProps = {
  banners: PromoBanner[]
}

const PromoBanners: React.FC<PromoBannersProps> = ({ banners }) => {
  if (!banners || banners.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {banners.map((banner) => (
        <Link
          key={banner.id}
          href={banner.link ?? "#"}
          style={{ backgroundColor: resolveColorValue(banner.bgClass) ?? "#6d28d9" }}
          className="block relative h-48 rounded-2xl overflow-hidden group"
        >
          <Image
            src={banner.image}
            alt={banner.title}
            fill
            className="object-cover opacity-70 group-hover:scale-105 transition-transform"
            sizes="(max-width: 1024px) 100vw, 25vw"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-4">
            <p className="text-xs font-medium opacity-80">SUPER SALE</p>
            <h3 className="text-2xl font-black">{banner.title}</h3>
            <p className="text-xl font-bold text-yellow-400">{banner.subtitle}</p>
            <span className="mt-2 px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">
              {banner.discount}
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}

export default PromoBanners
