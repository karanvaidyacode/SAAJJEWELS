import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

import ErrorBoundary from "./components/ErrorBoundary";
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
import CouponManagement from "./pages/CouponManagement";
import PopupManagement from "./pages/PopupManagement";

// Utility Components
import ScrollToTop from "./components/ScrollToTop";

// Protected Route Components
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import SiteLayout from "./components/SiteLayout";

function SiteProviders({ children }) {
  return (
    <CartProvider>
      <OfferProvider>
        <UserDataProvider>
          {children}
        </UserDataProvider>
      </OfferProvider>
    </CartProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <Routes>
          {/* Admin routes — no header/footer, no cart/offer providers */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminProtectedRoute><NewAdminDashboard /></AdminProtectedRoute>} />
          <Route path="/admin/orders" element={<AdminProtectedRoute><OrderManagement /></AdminProtectedRoute>} />
          <Route path="/admin/orders/:id" element={<AdminProtectedRoute><OrderDetails /></AdminProtectedRoute>} />
          <Route path="/admin/inventory" element={<AdminProtectedRoute><InventoryDashboard /></AdminProtectedRoute>} />
          <Route path="/admin/customers" element={<AdminProtectedRoute><CustomerManagement /></AdminProtectedRoute>} />
          <Route path="/admin/custom-orders" element={<AdminProtectedRoute><CustomOrders /></AdminProtectedRoute>} />
          <Route path="/admin/payments" element={<AdminProtectedRoute><PaymentManagement /></AdminProtectedRoute>} />
          <Route path="/admin/coupons" element={<AdminProtectedRoute><CouponManagement /></AdminProtectedRoute>} />
          <Route path="/admin/popups" element={<AdminProtectedRoute><PopupManagement /></AdminProtectedRoute>} />

          {/* Public site routes — wrapped in shared providers and layout */}
          <Route path="/" element={<SiteProviders><SiteLayout><Index /></SiteLayout></SiteProviders>} />
          <Route path="/products" element={<SiteProviders><SiteLayout><Products /></SiteLayout></SiteProviders>} />
          <Route path="/products/:id" element={<SiteProviders><SiteLayout><ProductDetail /></SiteLayout></SiteProviders>} />
          <Route path="/cart" element={<SiteProviders><SiteLayout><Cart /></SiteLayout></SiteProviders>} />
          <Route path="/checkout" element={<SiteProviders><SiteLayout><Checkout /></SiteLayout></SiteProviders>} />
          <Route path="/order-confirmation/:orderId?" element={<SiteProviders><SiteLayout><OrderConfirmation /></SiteLayout></SiteProviders>} />
          <Route path="/login" element={<SiteProviders><SiteLayout><Login /></SiteLayout></SiteProviders>} />
          <Route path="/contact-us" element={<SiteProviders><SiteLayout><ContactUs /></SiteLayout></SiteProviders>} />
          <Route path="/search" element={<SiteProviders><SiteLayout><SearchResults /></SiteLayout></SiteProviders>} />
          <Route path="/terms-and-conditions" element={<SiteProviders><SiteLayout><TermsAndConditions /></SiteLayout></SiteProviders>} />
          <Route path="/privacy-policy" element={<SiteProviders><SiteLayout><PrivacyPolicy /></SiteLayout></SiteProviders>} />
          <Route path="/shipping-policy" element={<SiteProviders><SiteLayout><ShippingPolicy /></SiteLayout></SiteProviders>} />
          <Route path="/return-policy" element={<SiteProviders><SiteLayout><ReturnPolicy /></SiteLayout></SiteProviders>} />
          <Route path="*" element={<SiteProviders><SiteLayout><NotFound /></SiteLayout></SiteProviders>} />
        </Routes>
      </AuthProvider>
    </Router>
    </ErrorBoundary>
  );
}

export default App;
