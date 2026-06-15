'use client'

import React from 'react'
import { Info } from 'lucide-react'

const ProductTabs = ({
  description,
}: {
  description: string
}) => {
  return (
    <div className="bg-white rounded-2xl border border-violet-100 overflow-hidden">
      {/* Tab Header */}
      <div className="flex border-b border-violet-100">
        <div className="flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium text-violet-700 bg-violet-50 border-b-2 border-violet-600">
          <Info className="w-4 h-4" />
          <span>Description</span>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        <div className="prose prose-violet max-w-none">
          <p className="text-gray-600 leading-relaxed whitespace-pre-line">
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}

export default ProductTabs
