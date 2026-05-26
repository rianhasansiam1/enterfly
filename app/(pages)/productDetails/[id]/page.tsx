import { Metadata } from 'next'
import Breadcrumbs from '../components/Breadcrumbs'
import ProductGallery from '../components/ProductGallery'
import ProductInfo from '../components/ProductInfo'
import ProductActions from '../components/ProductActions'
import RelatedProducts from '../components/RelatedProducts'
import RecentProducts from '../components/RecentProducts'

import DealsCarousel from '../components/DealsCarousel'
import PromoBanners from '../components/PromoBanners'
import { 
  products,
  getRecentProducts,
  getRelatedProducts,
  dealBanners,
  promoBanners,
  type ProductDetails
} from '@/store'

// ============================================================================
// DATABASE LOOKUP
// ============================================================================

const productsDatabase: Record<string, ProductDetails> = {}
products.forEach(p => {
  productsDatabase[p.id.toString()] = p
})

// ============================================================================
// TYPES
// ============================================================================

type Props = {
  params: Promise<{ id: string }>
}

// ============================================================================
// METADATA GENERATION
// ============================================================================

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const product = productsDatabase[id]
  
  if (!product) {
    return {
      title: 'Product Not Found | NearByDeals',
      description: 'The requested product could not be found.'
    }
  }

  return {
    title: `${product.name} | NearByDeals - Local Marketplace`,
    description: product.description.substring(0, 160),
    keywords: [product.name, product.brand, product.category, 'local shopping', 'nearby deals'],
    openGraph: {
      title: `${product.name} | NearByDeals`,
      description: product.description.substring(0, 160),
      type: 'website',
      images: [product.images[0]]
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function ProductDetailsPage({ params }: Props) {
  const { id } = await params
  const product = productsDatabase[id]

  // Handle product not found
  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-violet-800 mb-4">Product Not Found</h1>
          <p className="text-violet-600 mb-6">The product you&apos;re looking for doesn&apos;t exist.</p>
          <a 
            href="/products" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 text-white font-medium rounded-xl hover:bg-violet-700 transition-all"
          >
            Browse Products
          </a>
        </div>
      </div>
    )
  }

  // Prepare data
  const breadcrumbItems = [
    { label: product.category, href: `/products?category=${product.category.toLowerCase()}` },
    { label: product.name }
  ]

  // Get related and recent products using new unified store
  const recentProducts = getRecentProducts(product.id, 6).map(p => ({
    id: p.id,
    name: p.name,
    image: p.image,
    price: p.pricing.price,
    originalPrice: p.pricing.originalPrice,
    discount: p.pricing.discount
  }))
  
  const relatedProducts = getRelatedProducts(product.id, 16).map(p => ({
    id: p.id,
    name: p.name,
    image: p.image,
    price: p.pricing.price,
    originalPrice: p.pricing.originalPrice,
    discount: p.pricing.discount
  }))

  return (
    <div className="min-h-screen bg-gray-50"> 
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumbs with Tabs */}
        <Breadcrumbs items={breadcrumbItems} />




        {/* Main Product Section - 3 Column Layout */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6  ">
          {/* Left Column - Gallery */}
          <div className="lg:col-span-4">
            <ProductGallery
              images={product.images}
              productName={product.name}
            />


        
            
             

              {/* Find Deals Near You - Two Separate Cards */}
              <div className="mt-4 flex gap-3">
                {/* Map Card */}
                <div className="relative w-40 h-32 flex-shrink-0 rounded-2xl overflow-hidden border-2 border-violet-200">
                  {/* Map Background */}
                  <div className="absolute inset-0 bg-[#f5f0e8]">
                    <svg viewBox="0 0 200 150" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
                      {/* Background base */}
                      <rect width="200" height="150" fill="#f0ebe3"/>
                      
                      {/* Green park areas */}
                      <ellipse cx="30" cy="25" rx="25" ry="20" fill="#c7e6c7"/>
                      <ellipse cx="170" cy="120" rx="30" ry="25" fill="#c7e6c7"/>
                      <ellipse cx="45" cy="130" rx="20" ry="15" fill="#d4edd4"/>
                      
                      {/* Water/River */}
                      <path d="M0 60 Q40 50, 60 70 Q80 90, 100 75 Q130 55, 160 80 Q180 95, 200 85" 
                            stroke="#a8d4e6" strokeWidth="12" fill="none" strokeLinecap="round"/>
                      <path d="M0 60 Q40 50, 60 70 Q80 90, 100 75 Q130 55, 160 80 Q180 95, 200 85" 
                            stroke="#8ec5db" strokeWidth="6" fill="none" strokeLinecap="round"/>
                      
                      {/* Major Roads - Yellow */}
                      <path d="M0 100 L80 100 Q100 100, 100 80 L100 0" 
                            stroke="#f5d96a" strokeWidth="8" fill="none" strokeLinecap="round"/>
                      <path d="M0 100 L80 100 Q100 100, 100 80 L100 0" 
                            stroke="#fae89a" strokeWidth="4" fill="none" strokeLinecap="round"/>
                      
                      {/* Secondary Roads */}
                      <path d="M50 150 L50 110 Q50 100, 60 100" 
                            stroke="#f5d96a" strokeWidth="6" fill="none" strokeLinecap="round"/>
                      <path d="M140 0 L140 40 Q140 50, 150 50 L200 50" 
                            stroke="#e8e8e8" strokeWidth="5" fill="none" strokeLinecap="round"/>
                      <path d="M0 30 L60 30" 
                            stroke="#e8e8e8" strokeWidth="4" fill="none" strokeLinecap="round"/>
                      
                      {/* Small streets grid */}
                      <path d="M120 100 L120 150" stroke="#e8e8e8" strokeWidth="3" fill="none"/>
                      <path d="M160 70 L160 150" stroke="#e8e8e8" strokeWidth="3" fill="none"/>
                      <path d="M100 120 L200 120" stroke="#e8e8e8" strokeWidth="3" fill="none"/>
                    </svg>
                  </div>
                  
                  {/* Location Pin - Centered */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <svg className="w-8 h-10 drop-shadow-lg" viewBox="0 0 24 32">
                      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20c0-6.6-5.4-12-12-12z" fill="#ef4444"/>
                      <circle cx="12" cy="12" r="4" fill="#fecaca"/>
                    </svg>
                  </div>
                  
                  {/* Navigation Concept Badge */}
                  <div className="absolute top-2 left-2 bg-violet-600 text-white text-[8px] px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-sm">
                    <span className="font-medium">Navigation Concept</span>
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>

                {/* Content Card */}
                <div className="flex-1 bg-violet-50 rounded-2xl border-2 border-violet-200 flex flex-col justify-center items-center p-4 gap-3">
                  <h3 className="text-lg font-semibold text-gray-800 text-center leading-snug">
                    Find other best<br/>delas near 10 km
                  </h3>
                  <button className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-5 py-2 rounded-full transition-colors shadow-sm">
                    Go to delas
                  </button>
                </div>
              </div>


        

            
          </div>

          {/* Center Column - Product Info */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <ProductInfo
                name={product.name}
                price={product.pricing.price}
                originalPrice={product.pricing.originalPrice}
                discount={product.pricing.discount}
                specs={product.specs}
                deliveryTime={product.deliveryTime}
              />

              <ProductActions
                productId={product.id}
                productName={product.name}
                price={product.pricing.price}
                inStock={product.stock.inStock}
                stockCount={product.stock.stockCount}
              />
            </div>

           
          </div>

          {/* Right Column - Recent Products */}
          <div className="lg:col-span-3">
            <RecentProducts 
              products={recentProducts} 
              title="Recent Product"
            />
          </div>



        </div>



































        {/* Nearby Deals Card - Mobile */}
        <div className="mt-6 lg:hidden">
          {/* Find Deals Near You - Two Separate Cards (Mobile) */}
          <div className="flex gap-3">
            {/* Map Card */}
            <div className="relative w-36 h-28 flex-shrink-0 rounded-2xl overflow-hidden border-2 border-violet-200">
              {/* Map Background */}
              <div className="absolute inset-0 bg-[#f5f0e8]">
                <svg viewBox="0 0 200 150" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
                  {/* Background base */}
                  <rect width="200" height="150" fill="#f0ebe3"/>
                  
                  {/* Green park areas */}
                  <ellipse cx="30" cy="25" rx="25" ry="20" fill="#c7e6c7"/>
                  <ellipse cx="170" cy="120" rx="30" ry="25" fill="#c7e6c7"/>
                  <ellipse cx="45" cy="130" rx="20" ry="15" fill="#d4edd4"/>
                  
                  {/* Water/River */}
                  <path d="M0 60 Q40 50, 60 70 Q80 90, 100 75 Q130 55, 160 80 Q180 95, 200 85" 
                        stroke="#a8d4e6" strokeWidth="12" fill="none" strokeLinecap="round"/>
                  <path d="M0 60 Q40 50, 60 70 Q80 90, 100 75 Q130 55, 160 80 Q180 95, 200 85" 
                        stroke="#8ec5db" strokeWidth="6" fill="none" strokeLinecap="round"/>
                  
                  {/* Major Roads - Yellow */}
                  <path d="M0 100 L80 100 Q100 100, 100 80 L100 0" 
                        stroke="#f5d96a" strokeWidth="8" fill="none" strokeLinecap="round"/>
                  <path d="M0 100 L80 100 Q100 100, 100 80 L100 0" 
                        stroke="#fae89a" strokeWidth="4" fill="none" strokeLinecap="round"/>
                  
                  {/* Secondary Roads */}
                  <path d="M50 150 L50 110 Q50 100, 60 100" 
                        stroke="#f5d96a" strokeWidth="6" fill="none" strokeLinecap="round"/>
                  <path d="M140 0 L140 40 Q140 50, 150 50 L200 50" 
                        stroke="#e8e8e8" strokeWidth="5" fill="none" strokeLinecap="round"/>
                  <path d="M0 30 L60 30" 
                        stroke="#e8e8e8" strokeWidth="4" fill="none" strokeLinecap="round"/>
                  
                  {/* Small streets grid */}
                  <path d="M120 100 L120 150" stroke="#e8e8e8" strokeWidth="3" fill="none"/>
                  <path d="M160 70 L160 150" stroke="#e8e8e8" strokeWidth="3" fill="none"/>
                  <path d="M100 120 L200 120" stroke="#e8e8e8" strokeWidth="3" fill="none"/>
                </svg>
              </div>
              
              {/* Location Pin - Centered */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <svg className="w-7 h-9 drop-shadow-lg" viewBox="0 0 24 32">
                  <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20c0-6.6-5.4-12-12-12z" fill="#ef4444"/>
                  <circle cx="12" cy="12" r="4" fill="#fecaca"/>
                </svg>
              </div>
              
              {/* Navigation Concept Badge */}
              <div className="absolute top-1.5 left-1.5 bg-violet-600 text-white text-[7px] px-1 py-0.5 rounded flex items-center gap-0.5 shadow-sm">
                <span className="font-medium">Navigation Concept</span>
                <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </div>

            {/* Content Card */}
            <div className="flex-1 bg-violet-50 rounded-2xl border-2 border-violet-200 flex flex-col justify-center items-center p-3 gap-2">
              <h3 className="text-base font-semibold text-gray-800 text-center leading-snug">
                Find other best<br/>delas near 10 km
              </h3>
              <button className="bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium px-4 py-1.5 rounded-full transition-colors shadow-sm">
                Go to delas
              </button>
            </div>
          </div>
        </div>

        {/* Black Friday Deals Carousel */}
        <div className="mt-10">
          <DealsCarousel 
            deals={dealBanners} 
            title="Black Friday Deals" 
          />
        </div>

        {/* More Relevant Products Section with Promo Banners */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
          {/* Products Grid */}
          <div className="lg:col-span-9">
            <RelatedProducts 
              products={relatedProducts} 
              title="More Relevant Product" 
            />
          </div>

          {/* Promo Banners Sidebar */}
          <div className="lg:col-span-3">
            <PromoBanners banners={promoBanners} />
          </div>
        </div>
      </div>
    </div>
  )
}
