import React from "react";
import { formatINR, getOriginalPrice, getDiscountedPrice, hasDiscount } from "@/lib/pricing";

export const PriceWithDiscount = ({ product, price, discount, className = "", size = "base", showBadge = true }) => {
  // Accept either `product` or explicit `price`/`discount`
  const originalPrice = typeof price === "number" ? price : getOriginalPrice(product);
  const discountedPrice = typeof discount === "number" ? discount : getDiscountedPrice(product);
  const hasProductDiscount = hasDiscount(product);

  const sizeMapDiscount = {
    sm: "text-sm",
    base: "text-base sm:text-lg",
    lg: "text-lg sm:text-xl",
    xl: "text-2xl md:text-3xl",
  };
  const sizeMapOriginal = {
    sm: "text-xs sm:text-sm",
    base: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };
  const discountedClass = sizeMapDiscount[size] || sizeMapDiscount.base;
  const originalClass = sizeMapOriginal[size] || sizeMapOriginal.base;

  // If no discount, render single price (accent)
  if (!hasProductDiscount) {
    return (
      <div className={`flex flex-col gap-y-1 ${className}`}>
        <span className={`font-bold text-accent ${sizeMapDiscount[size] || sizeMapDiscount.base}`}>{formatINR(originalPrice)}</span>
      </div>
    );
  }

  // With discount: original (smaller, strikethrough) on top, discounted (larger, red) below
  return (
    <div className={`flex flex-col gap-y-1 ${className}`}>
      <span className={`text-muted-foreground line-through opacity-75 ${originalClass}`}>{formatINR(originalPrice)}</span>
      <div className="flex items-baseline gap-x-1">
        <span className={`font-bold text-red-600 ${discountedClass}`}>{formatINR(discountedPrice)}</span>
      </div>
    </div>
  );
};

export default PriceWithDiscount;