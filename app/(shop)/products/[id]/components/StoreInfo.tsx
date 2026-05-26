'use client'

import React from 'react'
import Image from 'next/image'
import { MapPin, Clock, Star, ShieldCheck, MessageCircle, ExternalLink } from 'lucide-react'

const StoreInfo = ({
  name,
  image,
  rating,
  reviews,
  verified,
  distance,
  walkTime,
  bikeTime,
  carTime,
  address,
  openHours,
}: {
  name: string
  image: string
  rating: number
  reviews: number
  verified: boolean
  distance: string
  walkTime: string
  bikeTime: string
  carTime: string
  address: string
  openHours: string
}) => {
  return (
    <div className="bg-white rounded-2xl border border-violet-100 p-5 space-y-4 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <span className="w-1 h-5 bg-linear-to-b from-violet-500 to-indigo-500 rounded-full" />
        Sold by
      </h3>

      {/* Store Card */}
      <div className="flex items-start gap-4">
        <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-violet-100 shrink-0">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover"
          />
          {verified && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate">{name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-medium text-gray-700">{rating.toFixed(1)}</span>
            </div>
            <span className="text-sm text-gray-400">({reviews.toLocaleString()})</span>
          </div>
        </div>
      </div>

      {/* Location Info */}
      <div className="space-y-3 pt-3 border-t border-gray-100">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-gray-600">{address}</p>
            <p className="text-sm font-medium text-violet-600 mt-0.5">{distance} away</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-violet-500 shrink-0" />
          <div>
            <p className="text-sm text-gray-600">{openHours}</p>
          </div>
        </div>
      </div>

      {/* Travel Times */}
      <div className="flex gap-2 pt-3 border-t border-gray-100">
        <div className="flex-1 p-2.5 bg-violet-50 rounded-lg text-center">
          <p className="text-lg">🚶</p>
          <p className="text-xs text-gray-500">Walk</p>
          <p className="text-sm font-medium text-violet-700">{walkTime}</p>
        </div>
        <div className="flex-1 p-2.5 bg-violet-50 rounded-lg text-center">
          <p className="text-lg">🚲</p>
          <p className="text-xs text-gray-500">Bike</p>
          <p className="text-sm font-medium text-violet-700">{bikeTime}</p>
        </div>
        <div className="flex-1 p-2.5 bg-violet-50 rounded-lg text-center">
          <p className="text-lg">🚗</p>
          <p className="text-xs text-gray-500">Drive</p>
          <p className="text-sm font-medium text-violet-700">{carTime}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-linear-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-md shadow-violet-200">
          <MessageCircle className="w-4 h-4" />
          Contact Store
        </button>
        <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-violet-200 text-violet-700 text-sm font-medium rounded-xl hover:bg-violet-50 transition-all">
          <ExternalLink className="w-4 h-4" />
          Visit
        </button>
      </div>
    </div>
  )
}

export default StoreInfo
