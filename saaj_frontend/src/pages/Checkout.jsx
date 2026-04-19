import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";
import {
  ArrowLeft,
  CreditCard,
  MapPin,
  User,
  Mail,
  Phone,
  ShoppingCart,
  Package,
  Tag,
  X,
} from "lucide-react";
import { useOffer } from "@/contexts/OfferContext";
import { computeDiscountedPrice, getDiscountRate } from "@/lib/pricing";
import { fetchApi } from "@/lib/api";

// Add this: Razorpay script loader
const loadRazorpayScript = () =>
  new Promise((resolve, reject) => {
    if (document.getElementById("razorpay-script")) return resolve(true);
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
    document.body.appendChild(script);
  });

const CheckoutPage = () => {
  const { items, totalItems, clearCart } = useCart();
  const { remainingOffers, claimOffer, hasClaimedOffer } = useOffer();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Dynamic shipping config
  const [shippingEnabled, setShippingEnabled] = useState(true);
  const [shippingCostValue, setShippingCostValue] = useState(69);

  useEffect(() => {
    fetchApi("/api/admin/branding/shipping/public")
      .then((data) => {
        setShippingEnabled(data.enabled);
        setShippingCostValue(data.cost);
      })
      .catch(() => {
        setShippingEnabled(true);
        setShippingCostValue(69);
      });
  }, []);

  const [formData, setFormData] = useState({
    // Contact Information
    email: "",
    phone: "",

    // Delivery Information
    fullName: "",
    address: "",
    apartment: "",
    city: "",
    state: "",
    zipCode: "",

    // Payment Information
    paymentMethod: "razorpay",

    // Billing Information
    billingSameAsShipping: true,
    billingFullName: "",
    billingAddress: "",
    billingApartment: "",
    billingCity: "",
    billingState: "",
    billingZipCode: "",
  });

  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  // Calculate discounted subtotal for accurate pricing
  const discountedSubtotal = items.reduce((sum, item) => {
    const originalPrice = item.originalPrice || item.price || 0;
    const discountedPrice = item.discountedPrice || originalPrice;
    return sum + discountedPrice * item.quantity;
  }, 0);

  // Apply 10% offer discount if user has claimed offer and offers are available
  const offerDiscount =
    hasClaimedOffer && remainingOffers > 0 ? discountedSubtotal * 0.1 : 0;

  // Apply coupon discount (on top of offer discount)
  const couponDiscount = couponApplied ? couponApplied.calculatedDiscount : 0;
  const subtotalAfterOffer = Math.max(0, discountedSubtotal - offerDiscount - couponDiscount);

  const shippingCost = shippingEnabled ? shippingCostValue : 0;
  const codFee = 0;
  const orderTotal = subtotalAfterOffer + shippingCost;

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Coupon validation
  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) { setCouponError("Please enter a coupon code"); return; }
    setCouponError("");
    setCouponLoading(true);
    try {
      const result = await fetchApi("/api/coupons/validate", {
        method: "POST",
        body: JSON.stringify({ code, orderTotal: discountedSubtotal - offerDiscount, email: formData.email || null }),
      });
      setCouponApplied(result);
      setCouponError("");
    } catch (err) {
      setCouponApplied(null);
      setCouponError(err.message || "Invalid coupon code");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(null);
    setCouponCode("");
    setCouponError("");
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    const requiredFields = {
      email: "Email is required",
      phone: "Phone number is required",
      fullName: "Full name is required",
      address: "Address is required",
      city: "City is required",
      state: "State is required",
      zipCode: "ZIP code is required",
      paymentMethod: "Payment method is required",
    };

    Object.entries(requiredFields).forEach(([field, message]) => {
      if (!formData[field].trim()) {
        newErrors[field] = message;
      }
    });

    // Email validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone validation
    if (
      formData.phone &&
      !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ""))
    ) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // Billing address validation (when different from shipping)
    if (formData.billingSameAsShipping === false) {
      if (!formData.billingFullName.trim())
        newErrors.billingFullName = "Full name is required";
      if (!formData.billingAddress.trim())
        newErrors.billingAddress = "Address is required";
      if (!formData.billingCity.trim())
        newErrors.billingCity = "City is required";
      if (!formData.billingState.trim())
        newErrors.billingState = "State is required";
      if (!formData.billingZipCode.trim())
        newErrors.billingZipCode = "ZIP code is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Backend order create function
  const createOrder = async (amount) => {
    // Prepare order data with only the required parameters for Razorpay
    const orderData = {
      amount: Math.round(amount * 100), // Convert to paise (smallest currency unit)
      currency: "INR",
      receipt: "rcpt_" + Date.now(),
    };

    try {
      // Use the proper backend endpoint for production
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || ""}/api/razorpay/create-order`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData),
        }
      );

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Failed to create order";

        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          errorMessage = errorText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      console.error("Error creating order:", error);
      throw error; // Re-throw to be handled by the calling function
    }
  };

  // Payment verify API
  const verifyPayment = async (paymentDetails) => {
    // Add order data to the verification request
    const orderData = {
      customerName: formData.fullName,
      customerEmail: formData.email,
      customerPhone: formData.phone,
      totalAmount: subtotalAfterOffer + shippingCost,
      items: items.map((item) => ({
        ...item,
        price:
          item.discountedPrice ||
          computeDiscountedPrice(item.price, getDiscountRate(item)) ||
          item.price ||
          0,
        customRequest: item.customRequest,
        shirtSize: item.shirtSize,
        customPhotos: item.customPhotos,
      })),
    };

    try {
      // Use the proper backend endpoint for production
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || ""}/api/razorpay/verify-payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...paymentDetails,
            orderData: orderData,
          }),
        }
      );

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to verify payment");
      }

      return response.json();
    } catch (error) {
      console.error("Error verifying payment:", error);
      throw error; // Re-throw to be handled by the calling function
    }
  };

  const handleRazorpayPayment = async (orderNumber) => {
    await loadRazorpayScript();

    try {
      const totalWithShipping = subtotalAfterOffer + shippingCost;

      if (totalWithShipping < 1) {
        try {
          const orderData = {
            customerName: formData.fullName,
            customerEmail: formData.email,
            customerPhone: formData.phone,
            shippingAddress: `${formData.address}, ${formData.apartment}, ${formData.city}, ${formData.state} - ${formData.zipCode}`,
            items: items.map((item) => ({
              productId: item._id || item.id,
              name: item.name,
              quantity: item.quantity,
              price:
                item.discountedPrice ||
                computeDiscountedPrice(item.price, getDiscountRate(item)) ||
                item.price || 0,
              image: Array.isArray(item.media) && item.media.length > 0
                ? (typeof item.media[0] === 'string' ? item.media[0] : item.media[0]?.url)
                : (item.image || item.imageUrl || null),
              customRequest: item.customRequest,
              shirtSize: item.shirtSize,
              customPhotos: item.customPhotos,
            })),
            totalAmount: 0,
            originalSubtotal: discountedSubtotal,
            discountAmount: offerDiscount + couponDiscount,
            shippingCost: shippingCost,
            status: "pending",
            paymentMethod: "coupon",
            paymentStatus: "paid",
            orderNumber: orderNumber,
            couponCode: couponApplied?.code || null,
          };

          await fetchApi("/api/admin/orders", {
            method: "POST",
            body: JSON.stringify(orderData),
          });

          await claimOffer();

          toast({
            title: "Order Placed Successfully!",
            description: "Your order is fully covered by the coupon discount. No payment needed!",
            duration: 7000,
          });

              const totalItems = items.reduce((t, i) => t + i.quantity, 0);
              const confirmationState = {
                items: [...items],
                totalItems,
                totalAmount: 0,
                shippingAddress: {
                  fullName: formData.fullName,
                  address: formData.address,
                  apartment: formData.apartment,
                  city: formData.city,
                  state: formData.state,
                  zipCode: formData.zipCode,
                  phone: formData.phone,
                },
                paymentMethod: "coupon",
                orderNumber,
              };
              clearCart();
              navigate("/order-confirmation", { state: confirmationState });
        } catch (freeOrderError) {
          console.error("Error placing free order:", freeOrderError);
          toast({
            title: "Order Failed",
            description: "There was an error placing your order. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsProcessing(false);
        }
        return;
      }

      const order = await createOrder(totalWithShipping);
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount, // This receives amount in paise from backend
        currency: order.currency,
        name: "Saaj Jewels",
        description: "Jewelry Purchase",
        order_id: order.id,
        handler: async function (razorpayResponse) {
          try {
            // Verify payment with backend
            const verification = await verifyPayment(razorpayResponse);
            if (verification.status === "success") {
              // Claim the offer if available
              const offerClaimed = await claimOffer();

              // Show enhanced success message with discount information
              if (offerClaimed) {
                toast({
                  title: "Payment Successful with 10% Discount!",
                  description: `Thank you for your purchase! ₹${(
                    subtotalAfterOffer * 0.1
                  ).toFixed(
                    2
                  )} saved with our limited time offer. You'll receive an email confirmation shortly.`,
                  duration: 7000,
                });
              } else {
                toast({
                  title: "Payment Successful!",
                  description:
                    "Thank you for your purchase! You'll receive an email confirmation shortly.",
                  duration: 7000,
                });
              }

              // Send order to backend to save in database
              try {
                const orderData = {
                  customerName: formData.fullName,
                  customerEmail: formData.email,
                  customerPhone: formData.phone,
                  shippingAddress: `${formData.address}, ${formData.apartment}, ${formData.city}, ${formData.state} - ${formData.zipCode}`,
                  items: items.map((item) => ({
                    productId: item._id || item.id,
                    name: item.name,
                    quantity: item.quantity,
                    price:
                      item.discountedPrice ||
                      computeDiscountedPrice(
                        item.price,
                        getDiscountRate(item)
                      ) ||
                      item.price ||
                      0,
                    image: Array.isArray(item.media) && item.media.length > 0
                      ? (typeof item.media[0] === 'string' ? item.media[0] : item.media[0]?.url)
                      : (item.image || item.imageUrl || null),
                    customRequest: item.customRequest,
                    shirtSize: item.shirtSize,
                    customPhotos: item.customPhotos,
                  })),
                  totalAmount: subtotalAfterOffer + shippingCost,
                  originalSubtotal: discountedSubtotal,
                  discountAmount: offerDiscount + couponDiscount,
                  shippingCost: shippingCost,
                  status: "pending",
                  paymentMethod: formData.paymentMethod,
                  paymentStatus: "paid",
                  orderNumber: orderNumber,
                  razorpayOrderId: order.id,
                  razorpayPaymentId: razorpayResponse.razorpay_payment_id,
                  couponCode: couponApplied?.code || null,
                };

                const savedOrder = await fetchApi("/api/admin/orders", {
                  method: "POST",
                  body: JSON.stringify(orderData),
                });

                // Refresh orders and customers data in admin panels
                if (typeof window.refreshOrders === "function") {
                  window.refreshOrders();
                }
                if (typeof window.refreshCustomers === "function") {
                  window.refreshCustomers();
                }
              } catch (backendError) {
                console.error("Error saving order to backend:", backendError);
                // Show error to user but continue with order confirmation
                toast({
                  title: "Order Processing",
                  description:
                    "Your payment was successful, but we encountered an issue saving your order details. Don't worry - our team will process your order manually and you'll receive a confirmation email shortly.",
                  variant: "destructive",
                  duration: 10000,
                });
                // Continue with order confirmation even if backend save fails
              }

              const totalItems = items.reduce(
                (total, item) => total + item.quantity,
                0
              );

              const confirmationState = {
                items: [...items],
                totalItems: totalItems,
                totalAmount: subtotalAfterOffer + shippingCost,
                shippingAddress: {
                  fullName: formData.fullName,
                  address: formData.address,
                  apartment: formData.apartment,
                  city: formData.city,
                  state: formData.state,
                  zipCode: formData.zipCode,
                  phone: formData.phone,
                },
                paymentMethod: formData.paymentMethod || "razorpay",
                orderNumber: orderNumber,
              };

              clearCart();
              navigate(`/order-confirmation`, { state: confirmationState });
            } else {
              toast({
                title: "Payment Failed",
                description:
                  "Your payment could not be processed. Please try again or choose a different payment method.",
                variant: "destructive",
                duration: 7000,
              });
            }
          } catch (verificationError) {
            console.error("Error verifying payment:", verificationError);
            toast({
              title: "Payment Verification Failed",
              description:
                "We're verifying your payment in the background. You'll receive confirmation via email shortly. If you don't receive it within 15 minutes, please contact support.",
              variant: "destructive",
              duration: 10000,
            });
          }
        },
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone,
          method: "upi", // Default to UPI for Indian customers
        },
        notes: {
          address: `${formData.address}, ${formData.apartment}, ${formData.city}, ${formData.state} - ${formData.zipCode}`,
          product_info: items
            .map((item) => {
              // Use consistent pricing calculation
              const itemPrice =
                item.discountedPrice ||
                computeDiscountedPrice(item.price, getDiscountRate(item)) ||
                item.price ||
                0;
              return `${item.name} (x${item.quantity}) - ₹${(
                Number(itemPrice) * item.quantity
              ).toFixed(2)}${item.shirtSize ? ` [Size: ${item.shirtSize}]` : ""}`;
            })
            .join(", "),
          customer_id: formData.email,
          order_number: orderNumber,
          payment_method: "preferred_upi",
          business_name: "Saaj Jewels",
        },
        theme: {
          color: "#d4af37", // Gold color to match jewelry theme
          hide_topbar: false,
        },
        // Enhanced configuration for better aesthetics and UX
        config: {
          display: {
            blocks: {
              upi: {
                name: "Pay via UPI (Recommended)",
                instruments: [
                  {
                    method: "upi",
                  },
                ],
              },
              cards: {
                name: "Credit/Debit Cards",
                instruments: [
                  {
                    method: "card",
                  },
                ],
              },
              wallets: {
                name: "Digital Wallets",
                instruments: [
                  {
                    method: "wallet",
                  },
                ],
              },
              netbanking: {
                name: "Net Banking",
                instruments: [
                  {
                    method: "netbanking",
                  },
                ],
              },
            },
            sequence: [
              "block.upi",
              "block.cards",
              "block.wallets",
              "block.netbanking",
            ],
            preferences: {
              show_default_blocks: false,
            },
          },
        },
        // Enhanced options for better checkout experience
        options: {
          checkout_logo: true,
          backdrop: true,
          capture_email: true,
          capture_phone: true,
          send_sms_hash: true, // For faster OTP on mobile
          redirect: true,
          readonly: {
            email: formData.email ? true : false,
            contact: formData.phone ? true : false,
          },
        },
        // Modal behavior settings
        modal: {
          backdropclose: true,
          escape: true,
          handleback: true,
          confirm_close: true,
          ondismiss: function () {
            setIsProcessing(false);
            toast({
              title: "Payment Cancelled",
              description:
                "You can complete your payment anytime from the checkout page.",
              variant: "destructive",
            });
          },
        },
        // Enhanced timeout and retry settings
        timeout: 600,
        retry: {
          enabled: true,
          max_count: 3,
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (orderError) {
      console.error("Error creating order:", orderError);
      toast({
        title: "Order Creation Failed",
        description:
          "There was an error creating your order. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Please fix the errors",
        description: "Some required fields are missing or invalid.",
        variant: "destructive",
      });
      return;
    }

    // COD check removed

    // Generate order number at the beginning so it's available for both payment methods
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 9000) + 1000;
    const orderNumber = `SJ-${timestamp}-${random}`;

    setIsProcessing(true);

    try {
      if (formData.paymentMethod === "razorpay") {
        await handleRazorpayPayment(orderNumber);
        return;
      }
    } catch (error) {
      toast({
        title: "Order Processing Failed",
        description:
          "There was an error processing your order. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="text-center">
            <h1 className="text-3xl font-playfair font-bold text-primary mb-4">
              Your Cart is Empty
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Add some beautiful jewelry to your cart before checkout
            </p>
            <Button onClick={() => navigate("/products")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/50 via-amber-50/30 to-rose-50/50">
      <SEO title="Checkout" description="Complete your SAAJJEWELS purchase securely." url="/checkout" noindex />
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => navigate("/cart")}
            className="mb-4 border-2 border-rose-200 hover:bg-rose-50 hover:border-rose-300 transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cart
          </Button>
          <h1 className="text-4xl md:text-5xl font-playfair font-bold bg-gradient-to-r from-primary via-rose-600 to-primary bg-clip-text text-transparent mb-3">
            Checkout
          </h1>
          <p className="text-muted-foreground text-lg">
            Complete your order for {totalItems}{" "}
            {totalItems === 1 ? "item" : "items"}
          </p>

          {/* Progress Steps */}
          <div className="mt-6">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              {/* Step: Shopping Cart (previous) */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-muted-foreground/20 text-muted-foreground flex items-center justify-center mb-2">
                  <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Shopping Cart
                </p>
              </div>

              <div className="flex-1 h-0.5 bg-muted-foreground/30 mx-2"></div>

              {/* Step: Checkout (current) */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-accent text-white flex items-center justify-center mb-2">
                  <CreditCard className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <p className="text-xs md:text-sm font-semibold text-accent">
                  Checkout
                </p>
              </div>

              <div className="flex-1 h-0.5 bg-muted-foreground/30 mx-2"></div>

              {/* Step: Complete (next) */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-muted-foreground/20 text-muted-foreground flex items-center justify-center mb-2">
                  <Package className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Complete
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Contact Information */}
              <Card className="p-6 border-2 border-rose-200/50 shadow-lg bg-gradient-to-br from-white to-rose-50/20">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 flex items-center justify-center mr-3">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
                    Contact
                  </h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className={errors.email ? "border-destructive" : ""}
                      placeholder="Enter your email address"
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>
              </Card>

              {/* Delivery Information */}
              <Card className="p-6 border-2 border-rose-200/50 shadow-lg bg-gradient-to-br from-white to-rose-50/20">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 flex items-center justify-center mr-3">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
                    Delivery
                  </h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Full name</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) =>
                        handleInputChange("fullName", e.target.value)
                      }
                      className={errors.fullName ? "border-destructive" : ""}
                    />
                    {errors.fullName && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.fullName}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="address">Street address</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) =>
                          handleInputChange("address", e.target.value)
                        }
                        className={errors.address ? "border-destructive" : ""}
                      />
                      {errors.address && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.address}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="apartment">
                        Apartment, suite, etc. (optional)
                      </Label>
                      <Input
                        id="apartment"
                        value={formData.apartment}
                        onChange={(e) =>
                          handleInputChange("apartment", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) =>
                          handleInputChange("city", e.target.value)
                        }
                        className={errors.city ? "border-destructive" : ""}
                      />
                      {errors.city && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.city}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="state">State/Province</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) =>
                          handleInputChange("state", e.target.value)
                        }
                        className={errors.state ? "border-destructive" : ""}
                      />
                      {errors.state && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.state}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="zipCode">ZIP code</Label>
                      <Input
                        id="zipCode"
                        value={formData.zipCode}
                        onChange={(e) =>
                          handleInputChange("zipCode", e.target.value)
                        }
                        className={errors.zipCode ? "border-destructive" : ""}
                      />
                      {errors.zipCode && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.zipCode}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      className={errors.phone ? "border-destructive" : ""}
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>
              </Card>

              {/* Payment Information */}
              <Card className="p-6 border-2 border-rose-200/50 shadow-lg bg-gradient-to-br from-white to-rose-50/20">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 flex items-center justify-center mr-3">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
                    Payment
                  </h2>
                </div>
                <div className="space-y-4">
                  {/* Razorpay Option */}
                  <div className="border rounded-md p-3">
                    <div className="flex items-center mb-4">
                      <input
                        type="radio"
                        id="razorpay"
                        name="paymentMethod"
                        value="razorpay"
                        checked={formData.paymentMethod === "razorpay"}
                        onChange={() =>
                          handleInputChange("paymentMethod", "razorpay")
                        }
                        className="mr-2"
                      />
                      <Label
                        htmlFor="razorpay"
                        className="cursor-pointer flex items-center gap-2"
                      >
                        <span>Razorpay</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full font-medium">
                            Secure
                          </span>
                          {import.meta.env.VITE_RAZORPAY_KEY_ID?.startsWith('rzp_test') && (
                            <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-600 bg-amber-50 animate-pulse">
                              Test Mode
                            </Badge>
                          )}
                        </div>
                      </Label>
                    </div>

                    {formData.paymentMethod === "razorpay" && (
                      <div className="space-y-4 pl-6">
                        {import.meta.env.VITE_RAZORPAY_KEY_ID?.startsWith('rzp_test') && (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 mb-2">
                            <p className="font-bold mb-1">🛠️ Testing Instructions:</p>
                            <ul className="list-disc pl-4 space-y-1">
                              <li>Card: Use <code className="bg-amber-100 px-1">4111 1111 1111 1111</code></li>
                              <li>UPI: Use <code className="bg-amber-100 px-1">success@razorpay</code></li>
                              <li>Netbanking: Select any bank & click "Success"</li>
                            </ul>
                          </div>
                        )}
                        <div className="flex flex-col items-center justify-center p-4 border rounded-md bg-gray-50">
                          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-3">
                            <CreditCard className="w-8 h-8 text-white" />
                          </div>
                          <p className="text-sm text-muted-foreground text-center">
                            You will be redirected to Razorpay to complete your
                            payment securely.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cash on Delivery Option Removed */}
                </div>
              </Card>

              {/* Billing Address */}
              <Card className="p-6 border-2 border-rose-200/50 shadow-lg bg-gradient-to-br from-white to-rose-50/20">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 flex items-center justify-center mr-3">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
                    Billing address
                  </h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="billingSame"
                        name="billingSameAsShipping"
                        checked={formData.billingSameAsShipping === true}
                        onChange={() =>
                          handleInputChange("billingSameAsShipping", true)
                        }
                        className="mr-2"
                      />
                      <Label htmlFor="billingSame" className="cursor-pointer">
                        Same as shipping address
                      </Label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="billingDifferent"
                        name="billingSameAsShipping"
                        checked={formData.billingSameAsShipping === false}
                        onChange={() =>
                          handleInputChange("billingSameAsShipping", false)
                        }
                        className="mr-2"
                      />
                      <Label
                        htmlFor="billingDifferent"
                        className="cursor-pointer"
                      >
                        Use a different billing address
                      </Label>
                    </div>
                  </div>

                  {formData.billingSameAsShipping === false && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="billingFullName">Full name</Label>
                        <Input
                          id="billingFullName"
                          value={formData.billingFullName}
                          onChange={(e) =>
                            handleInputChange("billingFullName", e.target.value)
                          }
                          className={
                            errors.billingFullName ? "border-destructive" : ""
                          }
                        />
                        {errors.billingFullName && (
                          <p className="text-sm text-destructive mt-1">
                            {errors.billingFullName}
                          </p>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="billingAddress">Street address</Label>
                          <Input
                            id="billingAddress"
                            value={formData.billingAddress}
                            onChange={(e) =>
                              handleInputChange(
                                "billingAddress",
                                e.target.value
                              )
                            }
                            className={
                              errors.billingAddress ? "border-destructive" : ""
                            }
                          />
                          {errors.billingAddress && (
                            <p className="text-sm text-destructive mt-1">
                              {errors.billingAddress}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="billingApartment">
                            Apartment, suite, etc. (optional)
                          </Label>
                          <Input
                            id="billingApartment"
                            value={formData.billingApartment}
                            onChange={(e) =>
                              handleInputChange(
                                "billingApartment",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="billingCity">City</Label>
                          <Input
                            id="billingCity"
                            value={formData.billingCity}
                            onChange={(e) =>
                              handleInputChange("billingCity", e.target.value)
                            }
                            className={
                              errors.billingCity ? "border-destructive" : ""
                            }
                          />
                          {errors.billingCity && (
                            <p className="text-sm text-destructive mt-1">
                              {errors.billingCity}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="billingState">State/Province</Label>
                          <Input
                            id="billingState"
                            value={formData.billingState}
                            onChange={(e) =>
                              handleInputChange("billingState", e.target.value)
                            }
                            className={
                              errors.billingState ? "border-destructive" : ""
                            }
                          />
                          {errors.billingState && (
                            <p className="text-sm text-destructive mt-1">
                              {errors.billingState}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="billingZipCode">ZIP code</Label>
                          <Input
                            id="billingZipCode"
                            value={formData.billingZipCode}
                            onChange={(e) =>
                              handleInputChange(
                                "billingZipCode",
                                e.target.value
                              )
                            }
                            className={
                              errors.billingZipCode ? "border-destructive" : ""
                            }
                          />
                          {errors.billingZipCode && (
                            <p className="text-sm text-destructive mt-1">
                              {errors.billingZipCode}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full py-6 text-lg bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  "Place Order"
                )}
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-8 border-2 border-rose-200/50 shadow-xl bg-gradient-to-br from-white via-rose-50/30 to-amber-50/30">
              <div className="flex items-center mb-4">
                <img
                  src="/icon.png"
                  alt="Store icon"
                  className="w-10 h-10 rounded-md mr-3"
                />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Your purchase from
                  </p>
                  <p className="font-medium">SAAJJEWELS®</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="border-b border-rose-100 pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-lg">Order Summary</span>
                    <Badge variant="secondary">{totalItems} Items</Badge>
                  </div>

                  <div className="max-h-60 overflow-y-auto mb-4 space-y-3 pr-2 scrollbar-thin">
                    {items.map((item, i) => (
                      <div key={i} className="flex gap-3 text-sm border-b border-rose-50 pb-2 last:border-0">
                        <div className="w-12 h-12 rounded bg-white flex-shrink-0 overflow-hidden border">
                          <img 
                            src={(() => {
                              if (Array.isArray(item.media) && item.media.length > 0) {
                                const firstM = item.media[0];
                                return typeof firstM === 'string' ? firstM : (firstM.url || firstM);
                              }
                              return item.image || item.imageUrl || item.img || "https://placehold.co/100x100?text=No+Image";
                            })()} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.name}</p>
                          <p className="text-muted-foreground text-[10px]">Qty: {item.quantity} × ₹{Number(item.discountedPrice || item.price || 0).toFixed(2)}</p>
                          {item.shirtSize && <p className="text-[10px] text-accent font-semibold">Size: {item.shirtSize}</p>}
                          {item.customRequest && <p className="text-[10px] italic text-muted-foreground truncate">"{item.customRequest}"</p>}
                        </div>
                        <div className="text-right font-medium text-xs">
                          ₹{(Number(item.discountedPrice || item.price || 0) * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">₹{Number(discountedSubtotal).toFixed(2)}</span>
                    </div>

                    {offerDiscount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>10% Offer Discount</span>
                        <span>-₹{Number(offerDiscount).toFixed(2)}</span>
                      </div>
                    )}

                    {couponApplied && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          Coupon ({couponApplied.code})
                        </span>
                        <span>-₹{Number(couponDiscount).toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>{shippingCost === 0 ? "Free" : `₹${shippingCost}`}</span>
                    </div>
                  </div>
                </div>

                {/* Coupon Code Input */}
                <div className="border-b border-rose-100 pb-4">
                  {!couponApplied ? (
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Have a coupon?</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                          className="flex-1 uppercase tracking-wider text-sm"
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleApplyCoupon(); } }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleApplyCoupon}
                          disabled={couponLoading || !couponCode.trim()}
                          className="border-rose-200 hover:bg-rose-50 shrink-0"
                        >
                          {couponLoading ? "..." : "Apply"}
                        </Button>
                      </div>
                      {couponError && <p className="text-xs text-destructive mt-1.5">{couponError}</p>}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-emerald-600" />
                        <div>
                          <span className="font-mono font-bold text-emerald-800 text-sm">{couponApplied.code}</span>
                          <span className="text-xs text-emerald-600 ml-2">
                            {couponApplied.discountType === "percentage" ? `${couponApplied.discountValue}% off` : `₹${couponApplied.discountValue} off`}
                          </span>
                        </div>
                      </div>
                      <button onClick={handleRemoveCoupon} className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded" title="Remove coupon">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Offer Information */}
                {hasClaimedOffer && remainingOffers > 0 && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 animate-pulse">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1 text-sm">
                        <span className="text-lg">🎉</span>
                        <span className="text-green-800 font-bold">Offer Applied</span>
                      </div>
                      <span className="bg-green-200 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {remainingOffers} Left
                      </span>
                    </div>
                    <p className="text-green-700 text-xs font-medium">
                      You've saved 10% on this order!
                    </p>
                  </div>
                )}

                <div className="flex justify-between font-bold text-lg bg-gradient-to-r from-rose-50 to-amber-50 rounded-lg p-4 border-2 border-rose-200">
                  <span className="text-foreground">Total</span>
                  <span className="bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent text-xl">
                    ₹{(Number(subtotalAfterOffer) + Number(shippingCost) + Number(codFee)).toFixed(2)}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
