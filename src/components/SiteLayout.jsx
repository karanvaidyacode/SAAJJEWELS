import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AnnouncementBar from "@/components/AnnouncementBar";
import Header from "@/components/Header";
import SearchSection from "@/components/SearchSection";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import LoginOfferModal from "@/components/LoginOfferModal";
import FloatingOfferIcon from "@/components/FloatingOfferIcon";

const SiteLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  const hideSearch =
    location.pathname === "/login" ||
    location.pathname === "/cart" ||
    location.pathname === "/checkout" ||
    location.pathname.startsWith("/order-confirmation") ||
    location.pathname === "/contact-us" ||
    location.pathname === "/terms-and-conditions" ||
    location.pathname === "/privacy-policy" ||
    location.pathname === "/shipping-policy" ||
    location.pathname === "/return-policy";

  return (
    <div className="flex flex-col min-h-screen">
      <AnnouncementBar />
      <Header onToggleSidebar={toggleSidebar} isSidebarOpen={sidebarOpen} />
      {!hideSearch && <SearchSection />}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <main className="flex-1">
        {/* If SiteLayout is used as a wrapper (children provided) render them,
            otherwise render nested routes via Outlet */}
        {children ? children : <Outlet />}
      </main>
      <Footer />
      {/* Floating login offer modal - opens after 5s for unauthenticated users */}
      <LoginOfferModal />
      {/* Floating offer icon - shows when user declines the modal */}
      <FloatingOfferIcon />
    </div>
  );
};

export default SiteLayout;