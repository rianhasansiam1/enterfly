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
  specs: ProductSpec[]
  deliveryTime?: string
  productCode?: string | null
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
  specs,
  deliveryTime = '2 Hours',
  productCode,
}) => {
  return (
    <div className="space-y-6">
      {/* Product Name */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
          {name}
        </h1>
        {productCode && (
          <p className="mt-1 font-mono text-xs text-gray-400">
            Product Code: {productCode}
          </p>
        )}
      </div>

      {/* Specs List */}
      {specs.length > 0 && (
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
      )}

      {deliveryTime && (
        <p className="text-sm text-violet-600">Delivery in {deliveryTime}</p>
      )}
    </div>
  )
}

export default ProductInfo
