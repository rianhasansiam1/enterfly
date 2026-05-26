'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Star, ThumbsUp, ThumbsDown, CheckCircle, Filter, ChevronDown } from 'lucide-react'

const ReviewSection = ({
  reviews,
  averageRating,
  totalReviews,
  ratingDistribution,
}: {
  reviews: {
    id: number
    author: string
    avatar: string
    rating: number
    date: string
    title: string
    content: string
    helpful: number
    notHelpful: number
    verified: boolean
    images?: string[]
  }[]
  averageRating: number
  totalReviews: number
  ratingDistribution: { stars: number; count: number; percentage: number }[]
}) => {
  const [filterRating, setFilterRating] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<'newest' | 'helpful' | 'rating'>('newest')

  const filteredReviews = reviews.filter((review) =>
    filterRating ? review.rating === filterRating : true
  )

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <span className="w-1.5 h-6 bg-linear-to-b from-violet-500 to-indigo-500 rounded-full" />
        Customer Reviews
      </h2>

      {/* Rating Overview */}
      <div className="bg-white rounded-2xl border border-violet-100 p-6">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Average Rating */}
          <div className="text-center md:text-left md:border-r md:border-violet-100 md:pr-8">
            <div className="text-5xl font-bold text-violet-700 mb-2">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex items-center justify-center md:justify-start gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(averageRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-gray-500">
              Based on {totalReviews.toLocaleString()} reviews
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {ratingDistribution.map((item) => (
              <button
                key={item.stars}
                onClick={() =>
                  setFilterRating(filterRating === item.stars ? null : item.stars)
                }
                className={`w-full flex items-center gap-3 p-1.5 rounded-lg transition-all ${
                  filterRating === item.stars ? 'bg-violet-100' : 'hover:bg-gray-50'
                }`}
              >
                <span className="text-sm text-gray-600 w-8">{item.stars}★</span>
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-violet-500 to-indigo-500 rounded-full transition-all"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-500 w-12 text-right">
                  {item.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters & Sort */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500">
            {filterRating
              ? `Showing ${filterRating}-star reviews`
              : `All ${filteredReviews.length} reviews`}
          </span>
          {filterRating && (
            <button
              onClick={() => setFilterRating(null)}
              className="text-sm text-violet-600 hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="appearance-none pl-3 pr-8 py-2 bg-white border border-violet-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="newest">Newest First</option>
            <option value="helpful">Most Helpful</option>
            <option value="rating">Highest Rated</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.map((review) => (
          <div
            key={review.id}
            className="bg-white rounded-xl border border-violet-100 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
                <Image
                  src={review.avatar}
                  alt={review.author}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900">{review.author}</span>
                  {review.verified && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle className="w-3 h-3" />
                      Verified Purchase
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= review.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">{review.date}</span>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <h4 className="font-medium text-gray-900">{review.title}</h4>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                {review.content}
              </p>
            </div>

            {review.images && review.images.length > 0 && (
              <div className="flex gap-2 mt-3 overflow-x-auto">
                {review.images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-violet-100"
                  >
                    <Image src={img} alt={`Review image ${idx + 1}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-500">Was this helpful?</span>
              <button className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-violet-600 transition-colors">
                <ThumbsUp className="w-4 h-4" />
                {review.helpful}
              </button>
              <button className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors">
                <ThumbsDown className="w-4 h-4" />
                {review.notHelpful}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Write Review Button */}
      <div className="text-center pt-4">
        <button className="px-6 py-3 bg-linear-to-r from-violet-600 to-indigo-600 text-white font-medium rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-200">
          Write a Review
        </button>
      </div>
    </div>
  )
}

export default ReviewSection
