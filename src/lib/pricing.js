// Centralized pricing helpers for discounts
export const DEFAULT_DISCOUNT_RATE = 15; // percent

export const formatINR = (value) => `₹${(Number(value) || 0).toFixed(2)}`;

export const getDiscountRate = (product) => {
  const rate = product?.discount;
  const numericRate = Number(rate);
  if (typeof numericRate === "number" && numericRate > 0) return numericRate;
  return DEFAULT_DISCOUNT_RATE;
};

export const computeDiscountedPrice = (price, rate) => {
  const numericPrice = Number(price);
  if (!rate || rate <= 0) return numericPrice;
  const discounted = numericPrice * (1 - rate / 100);
  return Math.round(discounted * 100) / 100;
};

// New functions for manual pricing
export const getOriginalPrice = (product) => {
  // If product has manual originalPrice, use it
  if (product?.originalPrice) {
    return Number(product.originalPrice);
  }
  // Otherwise, use the regular price as original
  return Number(product?.price) || 0;
};

export const getDiscountedPrice = (product) => {
  // If product has manual discountedPrice, use it
  if (product?.discountedPrice) {
    return Number(product.discountedPrice);
  }
  // Otherwise, calculate from original price and discount rate
  const originalPrice = getOriginalPrice(product);
  const rate = getDiscountRate(product);
  return computeDiscountedPrice(originalPrice, rate);
};

export const hasDiscount = (product) => {
  // Check if product has manual pricing with discount
  if (product?.originalPrice && product?.discountedPrice) {
    return Number(product.originalPrice) > Number(product.discountedPrice);
  }
  // Check if product has discount rate
  const rate = getDiscountRate(product);
  return rate > 0;
};