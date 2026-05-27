"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart, Zap } from "lucide-react";
import { useSession } from "next-auth/react";
import { useDispatch } from "react-redux";

import {
  setCartData,
  setCartError as setCartErrorAction,
} from "@/store/slices/cart.slice";
import type { AppDispatch } from "@/store";
import {
  canUseServerCart,
  createCartItemOnServer,
  fetchServerCartSnapshot,
} from "@/features/cart/api";
import { computeCartSummary } from "@/features/cart/summary";
import {
  readLocalCart,
  upsertLocalCartItem,
  writeLocalCart,
} from "@/features/cart/storage";
import type { CartItem } from "@/features/cart/api";

const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400";

const ProductActions = ({
  productId,
  productName,
  price,
  inStock,
  stockCount = 10,
}: {
  productId: string | number;
  productName: string;
  price: number;
  inStock: boolean;
  stockCount?: number;
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [isCartBusy, setIsCartBusy] = useState(false);

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, Math.min(stockCount, prev + delta)));
  };

  const handleAddToCart = async () => {
    if (!inStock || isCartBusy) return;

    const productIdString = String(productId);
    const canUseServer = canUseServerCart(session?.user?.role, status);

    dispatch(setCartErrorAction(null));

    if (canUseServer) {
      setIsCartBusy(true);
      try {
        await createCartItemOnServer(productIdString, quantity);
        const snapshot = await fetchServerCartSnapshot();
        writeLocalCart(snapshot.items);
        dispatch(setCartData(snapshot));
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to add item to cart.";
        dispatch(setCartErrorAction(message));
      } finally {
        setIsCartBusy(false);
      }
      return;
    }

    const localBefore = readLocalCart();
    const optimisticItem: CartItem = {
      id: `local:${productIdString}`,
      productId: productIdString,
      name: productName,
      image: FALLBACK_PRODUCT_IMAGE,
      quantity,
      unitPrice: price,
      originalPrice: price,
      lineTotal: price * quantity,
      stock: Math.max(stockCount, 1),
      status: "ACTIVE",
    };

    const nextLocal = upsertLocalCartItem(localBefore, optimisticItem);
    writeLocalCart(nextLocal);
    dispatch(setCartData({ items: nextLocal, summary: computeCartSummary(nextLocal) }));
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div className="space-y-4 pt-4 border-t border-gray-100">
      <div className="flex items-center gap-4">
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => handleQuantityChange(-1)}
            disabled={quantity <= 1}
            className="p-2.5 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Minus className="w-4 h-4 text-gray-600" />
          </button>
          <span className="w-12 text-center font-medium text-gray-900">{quantity}</span>
          <button
            onClick={() => handleQuantityChange(1)}
            disabled={quantity >= stockCount}
            className="p-2.5 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <button
          onClick={() => {
            void handleAddToCart();
          }}
          disabled={!inStock || isCartBusy}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
            inStock
              ? addedToCart
                ? "bg-green-500 text-white"
                : "bg-violet-600 text-white hover:bg-violet-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          {addedToCart ? "Added!" : "Add to cart"}
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          if (!inStock) return;
          const productIdString = String(productId);
          const target = `/checkout?buy=${encodeURIComponent(productIdString)}:${quantity}`;
          // Buy Now requires an account so the order has a real userId.
          if (status !== "authenticated") {
            router.push(`/login?callbackUrl=${encodeURIComponent(target)}`);
            return;
          }
          router.push(target);
        }}
        disabled={!inStock}
        className={`flex w-full items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold transition-all ${
          inStock
            ? "bg-linear-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-md hover:-translate-y-0.5 hover:shadow-lg"
            : "bg-gray-200 text-gray-500 cursor-not-allowed"
        }`}
      >
        <Zap className="h-4 w-4" />
        Buy now
      </button>
    </div>
  );
};

export default ProductActions;
