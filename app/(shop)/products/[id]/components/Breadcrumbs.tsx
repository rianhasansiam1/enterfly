'use client'

import React, { useState } from 'react'
import { ChevronRight, Home, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const tabs = ['Latest', 'Offer', 'Popular']

const Breadcrumbs = ({
  items,
}: {
  items: { label: string; href?: string }[]
}) => {
  const [activeTab, setActiveTab] = useState('Latest')

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-100">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-sm overflow-x-auto">
        <Link
          href="/"
          className="flex items-center gap-1 text-gray-500 hover:text-violet-600 transition-colors shrink-0"
        >
          <Home className="w-4 h-4" />
          <span className="hidden sm:inline">Home</span>
        </Link>
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
            {item.href ? (
              <Link
                href={item.href}
                className="text-gray-500 hover:text-violet-600 transition-colors shrink-0"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-violet-700 font-medium truncate">{item.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Tabs and View Near Best Deals */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-sm font-medium rounded-full border transition-all ${
                activeTab === tab
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* View Near Best Deals Button */}
        <Link
          href="/map"
          className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-600 text-white text-sm font-medium rounded-full hover:bg-violet-700 transition-colors"
        >
          View Near Best Deals
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}

export default Breadcrumbs
