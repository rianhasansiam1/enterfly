"use client";

import Image from "next/image";
import ProductCard from "@/app/CommonComponents/Cards";
import { CategoriesBanner } from "./CategoriesBanner";
import { ChevronRight } from "lucide-react";

type Product = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  badge?: string;
};

type Category = {
  title: string;

  products: Product[];
  saleBanner?: {
    image: string;
    label: string;
    heading: string;
    discount: string;
    description: string;
  };
};

const categoriesData: Category[] = [
  {
    title: "Grocery & Essentials",
   
    products: [
      {
        id: "g1",
        name: "Fresh Organic Bananas",
        price: 49,
        originalPrice: 69,
        image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400",
        rating: 4.5,
        reviewCount: 120,
      },
      {
        id: "g2",
        name: "Whole Wheat Bread Loaf",
        price: 45,
        originalPrice: 60,
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400",
        rating: 4.2,
        reviewCount: 85,
      },
      {
        id: "g3",
        name: "Farm Fresh Eggs (12 Pack)",
        price: 89,
        originalPrice: 110,
        image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400",
        rating: 4.7,
        reviewCount: 200,
        badge: "Bestseller",
      },
      {
        id: "g4",
        name: "Organic Milk 1L",
        price: 65,
        originalPrice: 80,
        image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400",
        rating: 4.3,
        reviewCount: 95,
      },
      {
        id: "g5",
        name: "Fresh Tomatoes 1kg",
        price: 35,
        originalPrice: 50,
        image: "https://images.unsplash.com/photo-1546470427-0d62b9f43ce7?w=400",
        rating: 4.1,
        reviewCount: 60,
      },
      {
        id: "g6",
        name: "Basmati Rice 5kg Premium",
        price: 399,
        originalPrice: 520,
        image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400",
        rating: 4.6,
        reviewCount: 310,
        badge: "New",
      },
    ],
    saleBanner: {
      image: "https://images.unsplash.com/photo-1601599561213-832382fd07ba?w=400",
      label: "SALE",
      heading: "FLASH SALE",
      discount: "40%",
      description: "Grab amazing deals on selected groceries. Limited time offer!",
    },
  },
  {
    title: "Electronics & Gadgets",
   
    products: [
      {
        id: "e1",
        name: "Wireless Bluetooth Earbuds",
        price: 1299,
        originalPrice: 2499,
        image: "https://images.unsplash.com/photo-1590658268037-6bf12f8e4e12?w=400",
        rating: 4.4,
        reviewCount: 540,
        badge: "Hot Deal",
      },
      {
        id: "e2",
        name: "Smart Watch Fitness Tracker",
        price: 1999,
        originalPrice: 3499,
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
        rating: 4.3,
        reviewCount: 320,
      },
      {
        id: "e3",
        name: "Portable Power Bank 10000mAh",
        price: 799,
        originalPrice: 1299,
        image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400",
        rating: 4.5,
        reviewCount: 410,
      },
      {
        id: "e4",
        name: "USB-C Fast Charging Cable",
        price: 299,
        originalPrice: 499,
        image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400",
        rating: 4.1,
        reviewCount: 180,
      },
      {
        id: "e5",
        name: "Wireless Mouse Ergonomic",
        price: 599,
        originalPrice: 999,
        image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400",
        rating: 4.6,
        reviewCount: 275,
      },
      {
        id: "e6",
        name: "LED Desk Lamp Touch Control",
        price: 899,
        originalPrice: 1499,
        image: "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=400",
        rating: 4.2,
        reviewCount: 150,
        badge: "New",
      },
    ],
    saleBanner: {
      image: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=400",
      label: "MEGA DEAL",
      heading: "TECH FEST",
      discount: "50%",
      description: "Unbeatable prices on top electronics. Don't miss out!",
    },
  },
  {
    title: "Fashion & Clothing",
  
    products: [
      {
        id: "f1",
        name: "Men's Cotton Casual T-Shirt",
        price: 349,
        originalPrice: 699,
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
        rating: 4.3,
        reviewCount: 230,
      },
      {
        id: "f2",
        name: "Women's Summer Floral Dress",
        price: 799,
        originalPrice: 1499,
        image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400",
        rating: 4.5,
        reviewCount: 180,
        badge: "Trending",
      },
      {
        id: "f3",
        name: "Unisex Running Sneakers",
        price: 1299,
        originalPrice: 2199,
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
        rating: 4.7,
        reviewCount: 450,
      },
      {
        id: "f4",
        name: "Classic Denim Jeans Slim Fit",
        price: 899,
        originalPrice: 1599,
        image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400",
        rating: 4.2,
        reviewCount: 310,
      },
      {
        id: "f5",
        name: "Leather Belt Premium Quality",
        price: 499,
        originalPrice: 899,
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400",
        rating: 4.4,
        reviewCount: 125,
      },
      {
        id: "f6",
        name: "Stylish Sunglasses UV Protection",
        price: 599,
        originalPrice: 1199,
        image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400",
        rating: 4.6,
        reviewCount: 290,
        badge: "Bestseller",
      },
    ],
    saleBanner: {
      image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400",
      label: "SEASON SALE",
      heading: "STYLE UP",
      discount: "60%",
      description: "Refresh your wardrobe with trending styles at unbeatable prices!",
    },
  },
  {
    title: "Home & Kitchen",
  
    products: [
      {
        id: "h1",
        name: "Non-Stick Frying Pan Set",
        price: 699,
        originalPrice: 1299,
        image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400",
        rating: 4.5,
        reviewCount: 340,
      },
      {
        id: "h2",
        name: "Stainless Steel Water Bottle",
        price: 399,
        originalPrice: 699,
        image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400",
        rating: 4.3,
        reviewCount: 210,
        badge: "Eco-Friendly",
      },
      {
        id: "h3",
        name: "Cotton Bedsheet King Size",
        price: 899,
        originalPrice: 1599,
        image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400",
        rating: 4.4,
        reviewCount: 175,
      },
      {
        id: "h4",
        name: "Scented Candle Gift Set",
        price: 349,
        originalPrice: 599,
        image: "https://images.unsplash.com/photo-1602607688066-d694778ba902?w=400",
        rating: 4.6,
        reviewCount: 420,
      },
      {
        id: "h5",
        name: "Ceramic Coffee Mug Set (4 Pcs)",
        price: 499,
        originalPrice: 799,
        image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400",
        rating: 4.2,
        reviewCount: 95,
      },
      {
        id: "h6",
        name: "Indoor Plant Pot Decorative",
        price: 299,
        originalPrice: 499,
        image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400",
        rating: 4.7,
        reviewCount: 160,
        badge: "New",
      },
    ],
    saleBanner: {
      image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400",
      label: "HOME FEST",
      heading: "DECOR SALE",
      discount: "35%",
      description: "Transform your space with premium home essentials at great prices!",
    },
  },
];

export default function Categories() {
  return (
    <div className="space-y-10">
      {categoriesData.map((category, index) => (
        <section
          key={category.title}
          className="relative"
        >
          {/* Section Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
             
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  {category.title}
                </h2>
                <p className="text-xs text-gray-500 hidden sm:block">
                  {category.products.length} products available
                </p>
              </div>
            </div>
            <button className="flex items-center gap-1 text-sm font-semibold text-violet-600 hover:text-violet-800 transition-colors group">
              View All
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Divider */}
          <div className="h-0.5 bg-linear-to-r from-violet-500 via-purple-400 to-transparent rounded-full mb-4"></div>

          <div className="flex flex-col lg:flex-row gap-4">
            {/* Product Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 flex-1 gap-3 sm:gap-4">
              {category.products.map((item) => (
                <ProductCard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  price={item.price}
                  originalPrice={item.originalPrice}
                  image={item.image}
                  rating={item.rating}
                  reviewCount={item.reviewCount}
                  badge={item.badge}
                />
              ))}
            </div>

            {/* Flash Sale Banner - Desktop only */}
            {category.saleBanner && (
              <CategoriesBanner saleBanner={category.saleBanner} />
            )}
          </div>

          {/* Load More */}
          <div className="text-center mt-5">
            <button className="px-6 py-2.5 bg-linear-to-r from-violet-600 to-purple-600 text-white rounded-full font-semibold text-sm hover:from-violet-700 hover:to-purple-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 shadow-md">
              Load More Products
            </button>
          </div>

          {/* Section separator (except last) */}
          {index < categoriesData.length - 1 && (
            <div className="mt-8 border-b border-gray-100"></div>
          )}
        </section>
      ))}
    </div>
  );
}
