import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import {
  CheckCircle,
  Package,
  Truck,
  Mail,
  ArrowLeft,
  ShoppingCart,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { useUserData } from "@/contexts/UserDataContext";
import { fetchApi } from "@/lib/api";

const OrderConfirmation = () => {
  const { clearCart } = useCart();
  const { addOrder } = useUserData();
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId } = useParams();
  const orderAddedRef = useRef(false);
  const [orderInfo, setOrderInfo] = useState({
    items: [],
    totalItems: 0,
    totalAmount: 0,
    shippingAddress: {},
    paymentMethod: "",
    orderNumber: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // First try to get order information from location state
    if (location.state) {
      const stateItems = location.state.items || [];
      const calculatedTotalItems = stateItems.reduce(
        (sum, item) => sum + (item.quantity || 1),
        0
      );

      const orderData = {
        items: stateItems,
        totalItems: location.state.totalItems || calculatedTotalItems,
        totalAmount: location.state.totalAmount || 0,
        shippingAddress: location.state.shippingAddress || {},
        paymentMethod: location.state.paymentMethod || "",
        orderNumber:
          location.state.orderNumber ||
          `SJ-${Math.floor(Math.random() * 900000) + 100000}`,
      };

      setOrderInfo(orderData);
      setLoading(false);

      // Add order to history if not already added
      if (!orderAddedRef.current && orderData.totalAmount > 0) {
        addOrder({
          id: orderData.orderNumber,
          items: orderData.items,
          total: orderData.totalAmount,
          status: "confirmed",
          date: new Date().toISOString(),
        });
        orderAddedRef.current = true;
      }
    }
    // If no state or orderId exists, try to fetch from API
    else if (orderId) {
      try {
        // Set a fallback immediately in case API call fails
        setOrderInfo({
          items: [],
          totalItems: 0,
          totalAmount: 0,
          shippingAddress: {},
          paymentMethod: "",
          orderNumber: `SJ-${
            orderId || Math.floor(Math.random() * 900000) + 100000
          }`,
        });
        setLoading(false);

        // Attempt to fetch order details from API
        fetchApi(`/orders/${orderId}`)
          .then((data) => {
            if (data) {
              const fetchedItems = data.items || [];
              const calculatedTotalItems = fetchedItems.reduce(
                (sum, item) => sum + (item.quantity || 1),
                0
              );

              const orderData = {
                items: fetchedItems,
                totalItems: data.totalItems || calculatedTotalItems,
                totalAmount: data.totalAmount || 0,
                shippingAddress: data.shippingAddress || {},
                paymentMethod: data.paymentMethod || "",
                orderNumber: data.orderNumber || `SJ-${orderId}`,
              };

              setOrderInfo(orderData);

              // Add order to history if not already added
              if (!orderAddedRef.current && orderData.totalAmount > 0) {
                addOrder({
                  id: orderData.orderNumber,
                  items: orderData.items,
                  total: orderData.totalAmount,
                  status: "confirmed",
                  date: new Date().toISOString(),
                });
                orderAddedRef.current = true;
              }
            }
          })
          .catch((err) => {
            console.error("Failed to fetch order details:", err);
            // Error already handled with fallback data
          })
          .finally(() => {
            setLoading(false);
          });
      } catch (error) {
        console.error("Error in order confirmation:", error);
        setLoading(false);
      }
    } else {
      // Fallback if no state or orderId
      setOrderInfo({
        ...orderInfo,
        orderNumber: `SJ-${Math.floor(Math.random() * 900000) + 100000}`,
      });
      setLoading(false);
    }

    // Clear cart after displaying order info
    clearCart();
  }, [location.state, orderId, clearCart]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/50 via-amber-50/30 to-rose-50/50 py-8 md:py-16">
      <div className="max-w-6xl mx-auto px-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-2 border-green-200 rounded-2xl p-8 text-center shadow-xl animate-fade-in">
              <div className="flex justify-center items-center gap-3 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-lg animate-pulse">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-playfair font-bold bg-gradient-to-r from-green-700 via-emerald-700 to-green-700 bg-clip-text text-transparent mb-3">
                🎉 Order Confirmed!
              </h1>
              <p className="mt-2 text-lg text-green-700 font-medium">
                Thank you for your purchase. Your order has been successfully
                placed.
              </p>

              {/* Steps Indicator */}
              <div className="mt-6">
                <div className="flex items-center justify-center gap-4 sm:gap-6">
                  {/* Cart Step */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <span className="text-sm text-muted-foreground">Cart</span>
                  </div>
                  <span className="h-px w-8 sm:w-12 bg-border self-start mt-4"></span>
                  {/* Checkout Step */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Checkout
                    </span>
                  </div>
                  <span className="h-px w-8 sm:w-12 bg-border self-start mt-4"></span>
                  {/* Complete Step (active) */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-accent">
                      Complete
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="md:col-span-2 space-y-4">
                <Card className="border-2 border-rose-200/50 shadow-lg bg-gradient-to-br from-white to-rose-50/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Package className="w-4 h-4" />
                      <h2 className="text-lg font-semibold">Order Details</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Your order is being prepared. You will receive an email
                      when it ships.
                    </p>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Order Number</p>
                        <p className="font-medium">{orderInfo.orderNumber}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Items</p>
                        <p className="font-medium">{orderInfo.totalItems}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <p className="font-medium">Confirmed</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">
                          Estimated Delivery
                        </p>
                        <p className="font-medium">5–7 business days</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Payment Method</p>
                        <p className="font-medium">
                          {orderInfo.paymentMethod === "cod"
                            ? "Cash on Delivery"
                            : "Online Payment"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Amount</p>
                        <p className="font-medium">
                          ₹{(orderInfo.totalAmount || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Order Items */}
                    {orderInfo.items && orderInfo.items.length > 0 && (
                      <div className="mt-6 border-t pt-4">
                        <h3 className="text-sm font-medium mb-3">
                          Order Items
                        </h3>
                        <div className="space-y-3">
                          {orderInfo.items &&
                            orderInfo.items.map((item, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-3"
                              >
                                <div className="w-12 h-12 bg-muted rounded-md overflow-hidden">
                                  {item?.image && (
                                    <img
                                      src={item.image}
                                      alt={item?.name || "Product"}
                                      className="w-full h-full object-cover"
                                    />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium">
                                    {item?.name || "Product"}
                                  </p>
                                  <div className="flex justify-between">
                                    <p className="text-xs text-muted-foreground">
                                      Qty: {item?.quantity || 1}
                                    </p>
                                    <p className="text-xs font-medium">
                                      ₹
                                      {(
                                        (item?.discountedPrice || item?.price || 0) *
                                        (item?.quantity || 1)
                                      ).toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-2 border-rose-200/50 shadow-lg bg-gradient-to-br from-white to-rose-50/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 flex items-center justify-center">
                        <Truck className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-lg font-bold bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
                        Shipping
                      </h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      We'll send tracking details to your email once the order
                      ships.
                    </p>

                    {/* Shipping Address */}
                    {orderInfo.shippingAddress &&
                      Object.keys(orderInfo.shippingAddress).length > 0 && (
                        <div className="mt-4 text-sm">
                          <h3 className="font-medium mb-1">
                            Delivery Address:
                          </h3>
                          {orderInfo.shippingAddress.fullName && (
                            <p>{orderInfo.shippingAddress.fullName}</p>
                          )}
                          {orderInfo.shippingAddress.address && (
                            <p>{orderInfo.shippingAddress.address}</p>
                          )}
                          {orderInfo.shippingAddress.apartment && (
                            <p>{orderInfo.shippingAddress.apartment}</p>
                          )}
                          {(orderInfo.shippingAddress.city ||
                            orderInfo.shippingAddress.state ||
                            orderInfo.shippingAddress.zipCode) && (
                            <p>
                              {orderInfo.shippingAddress.city || ""}
                              {orderInfo.shippingAddress.city &&
                              orderInfo.shippingAddress.state
                                ? ", "
                                : ""}
                              {orderInfo.shippingAddress.state || ""}
                              {orderInfo.shippingAddress.zipCode || ""}
                            </p>
                          )}
                          {orderInfo.shippingAddress.phone && (
                            <p>Phone: {orderInfo.shippingAddress.phone}</p>
                          )}
                        </div>
                      )}
                  </CardContent>
                </Card>

                <Card className="border-2 border-rose-200/50 shadow-lg bg-gradient-to-br from-white to-rose-50/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-lg font-bold bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
                        Support
                      </h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      If you have any questions, contact us at
                      saajewels45@gmail.com
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => navigate("/")}
                    className="w-full bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    Continue Shopping
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full border-2 border-rose-200 hover:bg-rose-50 hover:border-rose-300 transition-all duration-200"
                    asChild
                  >
                    <Link to="/products">View All Products</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full hover:bg-rose-50 transition-all duration-200"
                    asChild
                  >
                    <Link to="/">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Home
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderConfirmation;
