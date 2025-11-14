import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useOffer } from "@/contexts/OfferContext";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  Package,
  CreditCard,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import PriceWithDiscount from "@/components/ui/Price";
import {
  computeDiscountedPrice,
  formatINR,
  getDiscountRate,
  getOriginalPrice,
  getDiscountedPrice,
} from "@/lib/pricing";

const CartPage = () => {
  const {
    items,
    totalItems,
    totalPrice,
    addToCart,
    removeFromCart,
    clearCart,
  } = useCart();
  const { remainingOffers, hasClaimedOffer, claimOffer } = useOffer();
  const navigate = useNavigate();

  // Shipping cost
  const shippingCostINR = 69;

  // Shifting these variables above for clarity
  const COD_MIN = 449;
  const FREE_SHIP_MIN = 799;
  const COD_CHARGE = 49;

  // Compute payment method to default to 'razorpay' for prepaid, but you might use context or props
  // Calculate if cod eligible
  const isCodEligible = parseFloat(totalPrice) >= COD_MIN;
  const isPrepaidEligibleForFreeShipping = parseFloat(totalPrice) >= FREE_SHIP_MIN;
  const paymentMethod = 'razorpay'; // Cart page can't choose method, handled at checkout

  // Calculate discounts
  const discountedSubtotal = items.reduce(
    (sum, item) => {
      // Use the correct price fields from the product model
      const originalPrice = getOriginalPrice(item);
      const discountedPrice = getDiscountedPrice(item);
      return sum + discountedPrice * item.quantity;
    },
    0
  );
  
  // Apply 10% offer discount if user has claimed offer and offers are available
  const offerDiscount = (hasClaimedOffer && remainingOffers > 0) ? discountedSubtotal * 0.10 : 0;
  const subtotalAfterOffer = discountedSubtotal - offerDiscount;
  
  const shippingCost = parseFloat(subtotalAfterOffer) >= FREE_SHIP_MIN ? 0 : 69;
  const grandTotal = (parseFloat(subtotalAfterOffer) + shippingCost).toFixed(2);

  // Page tracking
  useEffect(() => {
    console.log("Cart page viewed");
    return () => console.log("Cart page left");
  }, []);

  // Track cart updates
  useEffect(() => {
    if (items.length > 0) {
      console.log("Cart updated:", {
        totalItems,
        totalPrice,
        items: items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
      });
    }
  }, [items, totalItems, totalPrice]);

  // Handle empty cart state
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="text-center">
            <ShoppingCart className="w-24 h-24 text-muted-foreground mx-auto mb-6" />
            <h1 className="text-3xl font-playfair font-bold text-primary mb-4">
              Your Cart is Empty
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Discover our exquisite jewelry collection and add your favorites to the cart.
            </p>
            <Link to="/products">
              <Button className="bg-accent hover:bg-accent/90 text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Render cart
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/50 via-amber-50/30 to-rose-50/50">
      <div className="container mx-auto px-4 py-8 md:py-16 max-w-6xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-accent transition-colors duration-200">
            Home
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">Shopping Cart</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-playfair font-bold bg-gradient-to-r from-primary via-rose-600 to-primary bg-clip-text text-transparent mb-3">
                🛍️ Shopping Cart
              </h1>
              <p className="text-muted-foreground text-lg">
                {totalItems} {totalItems === 1 ? "item" : "items"} in your cart
              </p>
            </div>
            <Button
              variant="outline"
              onClick={clearCart}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 w-full sm:w-auto transition-all duration-200"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Clear Cart
            </Button>
          </div>
        </div>

        {/* Cart Items + Summary */}
        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left: Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, index) => (
              <Card
                key={item.id}
                className="overflow-hidden animate-fade-in border-2 hover:border-accent/50 transition-all duration-300 shadow-md hover:shadow-xl"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="p-4 md:p-6 bg-gradient-to-br from-white to-rose-50/20">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="w-20 h-20 md:w-24 md:h-24 aspect-square overflow-hidden relative rounded-xl flex-shrink-0 ring-2 ring-rose-100 group cursor-pointer">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div>
                          <h3 className="font-playfair font-semibold text-base md:text-lg text-foreground mb-1 truncate">
                            {item.name}
                          </h3>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            for (let i = 0; i < item.quantity; i++) {
                              removeFromCart(item._id || item.id);
                            }
                          }}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <p className="text-xs md:text-sm text-muted-foreground mb-4 line-clamp-2">
                        {item.description}
                      </p>

                      {/* Quantity and Pricing */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 bg-gradient-to-r from-rose-50 to-amber-50 rounded-lg p-1 border border-rose-200/50">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFromCart(item._id || item.id)}
                            className="w-8 h-8 p-0 hover:bg-rose-200/50 hover:text-rose-700 transition-all duration-200"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center font-bold text-rose-900">
                            {item.quantity}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => addToCart(item)}
                            className="w-8 h-8 p-0 hover:bg-rose-200/50 hover:text-rose-700 transition-all duration-200"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="text-right">
                          <PriceWithDiscount product={item} size="lg" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8 border-2 border-rose-200/50 shadow-xl bg-gradient-to-br from-white via-rose-50/30 to-amber-50/30">
              <div className="p-6">
                <h2 className="text-2xl font-playfair font-bold bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent mb-6">
                  Order Summary
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-base bg-white/60 rounded-lg p-3 border border-rose-100">
                    <span className="text-muted-foreground font-medium">Subtotal</span>
                    <span className="font-bold text-rose-600">
                      ₹{discountedSubtotal.toFixed(2)}
                    </span>
                  </div>
                  
                  {offerDiscount > 0 && (
                    <div className="flex justify-between text-base bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200 animate-pulse">
                      <span className="text-green-700 font-medium flex items-center gap-2">
                        <span className="text-xl">🎉</span>
                        10% Limited Offer Discount
                      </span>
                      <span className="font-bold text-green-600">
                        -₹{offerDiscount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-base bg-white/60 rounded-lg p-3 border border-rose-100">
                    <span className="text-muted-foreground font-medium">Shipping</span>
                    <span className="font-semibold text-amber-600">
                      {shippingCost === 0 ? <span className="text-green-600">Free 🎁</span> : `₹${shippingCost}`}
                    </span>
                  </div>

                  <div className="border-t-2 border-rose-200 pt-4 mt-4 bg-gradient-to-r from-rose-50 to-amber-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-foreground">Total</span>
                      <div className="text-right">
                        <span className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
                          ₹{grandTotal}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => navigate('/checkout')}
                  className="w-full bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white h-14 text-base font-bold shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 mb-3"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Proceed to Checkout
                </Button>

                <Link to="/products">
                  <Button variant="outline" className="w-full h-12 border-2 border-rose-200 hover:bg-rose-50 hover:border-rose-300 transition-all duration-200">
                    Continue Shopping
                  </Button>
                </Link>

                <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-rose-50 rounded-lg text-center border border-amber-200/50">
                  <p className="text-sm text-amber-800 font-medium">
                    🔒 Secure checkout • Shipping ₹69
                  </p>
                </div>
                {!isCodEligible && (
                  <div className="mt-2 text-xs text-center text-destructive">
                    COD available on orders above ₹449/-
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;