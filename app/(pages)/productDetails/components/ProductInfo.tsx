'use client'

import React from 'react'
import {
  Battery,
  Bluetooth,
  Headphones,
  Mic,
  Armchair,
  Lightbulb,
  SlidersHorizontal,
  Monitor,
  Cpu,
  Camera,
  HardDrive,
  Smartphone,
  Keyboard,
  Usb,
  Square,
  Settings,
  LucideIcon
} from 'lucide-react'

type ProductSpec = {
  id: string
  icon: string
  label: string
  value: string
}

type ProductInfoProps = {
  name: string
  price: number
  originalPrice: number
  discount: number
  specs: ProductSpec[]
  deliveryTime?: string
}

type IconName =
  | 'Battery'
  | 'Bluetooth'
  | 'Headphones'
  | 'Mic'
  | 'Armchair'
  | 'Lightbulb'
  | 'SlidersHorizontal'
  | 'Monitor'
  | 'Cpu'
  | 'Camera'
  | 'HardDrive'
  | 'Smartphone'
  | 'Keyboard'
  | 'Usb'
  | 'Square'
  | 'Settings'

// Icon mapping for dynamic rendering
const iconMap: Record<IconName, LucideIcon> = {
  Battery,
  Bluetooth,
  Headphones,
  Mic,
  Armchair,
  Lightbulb,
  SlidersHorizontal,
  Monitor,
  Cpu,
  Camera,
  HardDrive,
  Smartphone,
  Keyboard,
  Usb,
  Square,
  Settings,
}

const ProductInfo: React.FC<ProductInfoProps> = ({
  name,
  price,
  originalPrice,
  discount,
  specs,
  deliveryTime = '2 Hours',
}) => {
  return (
    <div className="space-y-6">
      {/* Product Name */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
          {name}
        </h1>
      </div>

      {/* Specs List */}
      <div className="space-y-3">
        {specs.map((spec) => {
          const IconComponent = iconMap[spec.icon as IconName] || Battery
          return (
            <div key={spec.id} className="flex gap-3 text-sm">
              <div className="shrink-0 w-5 h-5 mt-0.5 text-violet-600 flex items-center justify-center">
                <IconComponent className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-gray-900">{spec.label}:</span>{' '}
                <span className="text-gray-600">{spec.value}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Price */}
      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-3xl font-bold text-gray-900">
            {price.toLocaleString()} bdt
          </span>
          {discount > 0 && (
            <span className="text-lg text-gray-400 line-through">
              {originalPrice.toLocaleString()} bdt
            </span>
          )}
        </div>
        {deliveryTime && (
          <p className="text-sm text-violet-600 mt-1">
            Delivery in {deliveryTime}
          </p>
        )}
      </div>
    </div>
  )
}

export default ProductInfo
