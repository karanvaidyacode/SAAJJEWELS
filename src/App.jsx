import { useState, useEffect } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { CartProvider } from "./contexts/CartContext";
import { AuthProvider } from "./contexts/AuthContext";
import { OfferProvider } from "./contexts/OfferContext";
import { UserDataProvider } from "./contexts/UserDataContext";

// Pages
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Login from "./pages/Login";
import ContactUs from "./pages/ContactUs";
import SearchResults from "./pages/SearchResults";
import NewAdminDashboard from "./components/NewAdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import NotFound from "./pages/NotFound";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ShippingPolicy from "./pages/ShippingPolicy";
import ReturnPolicy from "./pages/ReturnPolicy";

// Admin Dashboard Pages
import OrderManagement from "./pages/OrderManagement";
import OrderDetails from "./pages/OrderDetails";
import InventoryDashboard from "./pages/InventoryDashboard";
import CustomerManagement from "./pages/CustomerManagement";
import CustomOrders from "./pages/CustomOrders";
import PaymentManagement from "./pages/PaymentManagement";

// Utility Components
import ScrollToTop from "./components/ScrollToTop";

// Protected Route Components
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import SiteLayout from "./components/SiteLayout";

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <Routes>
          {/* Admin routes - no header/footer */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <NewAdminDashboard />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <AdminProtectedRoute>
                <OrderManagement />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/orders/:id"
            element={
              <AdminProtectedRoute>
                <OrderDetails />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/inventory"
            element={
              <AdminProtectedRoute>
                <InventoryDashboard />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/customers"
            element={
              <AdminProtectedRoute>
                <CustomerManagement />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/custom-orders"
            element={
              <AdminProtectedRoute>
                <CustomOrders />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <AdminProtectedRoute>
                <PaymentManagement />
              </AdminProtectedRoute>
            }
          />
          
          {/* Main site routes with header/footer */}
          <Route
            path="/"
            element={
              <CartProvider>
                <OfferProvider>
                  <UserDataProvider>
                    <SiteLayout>
                      <Index />
                    </SiteLayout>
                  </UserDataProvider>
                </OfferProvider>
              </CartProvider>
            }
          />
          <Route
            path="/products"
            element={
              <CartProvider>
                <OfferProvider>
                  <UserDataProvider>
                    <SiteLayout>
                      <Products />
                    </SiteLayout>
                  </UserDataProvider>
                </OfferProvider>
              </CartProvider>
            }
          />
          <Route
            path="/products/:id"
            element={
              <CartProvider>
                <OfferProvider>
                  <UserDataProvider>
                    <SiteLayout>
                      <ProductDetail />
                    </SiteLayout>
                  </UserDataProvider>
                </OfferProvider>
              </CartProvider>
            }
          />
          <Route
            path="/cart"
            element={
              <CartProvider>
                <OfferProvider>
                  <UserDataProvider>
                    <SiteLayout>
                      <Cart />
                    </SiteLayout>
                  </UserDataProvider>
                </OfferProvider>
              </CartProvider>
            }
          />
          <Route
            path="/checkout"
            element={
              <CartProvider>
                <OfferProvider>
                  <UserDataProvider>
                    <SiteLayout>
                      <Checkout />
                    </SiteLayout>
                  </UserDataProvider>
                </OfferProvider>
              </CartProvider>
            }
          />
          <Route
            path="/order-confirmation/:orderId?"
            element={
              <CartProvider>
                <OfferProvider>
                  <UserDataProvider>
                    <SiteLayout>
                      <OrderConfirmation />
                    </SiteLayout>
                  </UserDataProvider>
                </OfferProvider>
              </CartProvider>
            }
          />
          <Route
            path="/login"
            element={
              <CartProvider>
                <OfferProvider>
                  <UserDataProvider>
                    <SiteLayout>
                      <Login />
                    </SiteLayout>
                  </UserDataProvider>
                </OfferProvider>
              </CartProvider>
            }
          />
          <Route
            path="/contact-us"
            element={
              <CartProvider>
                <OfferProvider>
                  <UserDataProvider>
                    <SiteLayout>
                      <ContactUs />
                    </SiteLayout>
                  </UserDataProvider>
                </OfferProvider>
              </CartProvider>
            }
          />
          <Route
            path="/search"
            element={
              <CartProvider>
                <OfferProvider>
                  <UserDataProvider>
                    <SiteLayout>
                      <SearchResults />
                    </SiteLayout>
                  </UserDataProvider>
                </OfferProvider>
              </CartProvider>
            }
          />
          <Route
            path="/terms-and-conditions"
            element={
              <CartProvider>
                <OfferProvider>
                  <UserDataProvider>
                    <SiteLayout>
                      <TermsAndConditions />
                    </SiteLayout>
                  </UserDataProvider>
                </OfferProvider>
              </CartProvider>
            }
          />
          <Route
            path="/privacy-policy"
            element={
              <CartProvider>
                <OfferProvider>
                  <UserDataProvider>
                    <SiteLayout>
                      <PrivacyPolicy />
                    </SiteLayout>
                  </UserDataProvider>
                </OfferProvider>
              </CartProvider>
            }
          />
          <Route
            path="/shipping-policy"
            element={
              <CartProvider>
                <OfferProvider>
                  <UserDataProvider>
                    <SiteLayout>
                      <ShippingPolicy />
                    </SiteLayout>
                  </UserDataProvider>
                </OfferProvider>
              </CartProvider>
            }
          />
          <Route
            path="/return-policy"
            element={
              <CartProvider>
                <OfferProvider>
                  <UserDataProvider>
                    <SiteLayout>
                      <ReturnPolicy />
                    </SiteLayout>
                  </UserDataProvider>
                </OfferProvider>
              </CartProvider>
            }
          />
          <Route
            path="*"
            element={
              <CartProvider>
                <OfferProvider>
                  <UserDataProvider>
                    <SiteLayout>
                      <NotFound />
                    </SiteLayout>
                  </UserDataProvider>
                </OfferProvider>
              </CartProvider>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;