import React, { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { 
  LayoutDashboard, 
  ListOrdered, 
  Package, 
  Users, 
  LogOut,
  Menu,
  X,
  Plus,
  List,
  Tag,
  Megaphone,
  Truck,
} from "lucide-react";
import { fetchApi } from "@/lib/api";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import Stats from "./dashboard-components/Stats";
import MiniSummary from "./dashboard-components/MiniSummary";
import TopSellingProducts from "./dashboard-components/TopSellingProducts";
import OrdersChart from "./dashboard-components/OrdersChart";
import AddProductForm from "./dashboard-components/AddProductForm";
import AllProductsList from "./dashboard-components/AllProductsList";
import RecentCustomizations from "./dashboard-components/RecentCustomizations";

const NewAdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");

  // Shipping settings
  const [shippingEnabled, setShippingEnabled] = useState(true);
  const [shippingCost, setShippingCost] = useState(69);
  const [shippingLoading, setShippingLoading] = useState(false);

  const adminToken = localStorage.getItem("adminToken");
  
  useEffect(() => {
    if (!adminToken) {
      navigate("/admin/login");
      return;
    }
    fetchApi("/api/admin/branding/shipping")
      .then((data) => {
        setShippingEnabled(data.enabled);
        setShippingCost(data.cost);
      })
      .catch(() => {
        setShippingEnabled(true);
        setShippingCost(69);
      });
  }, [adminToken, navigate]);
  
  if (!adminToken) {
    return null;
  }

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", action: () => setActiveView("dashboard") },
    { icon: Plus, label: "Add Product", action: () => setActiveView("add-product") },
    { icon: List, label: "All Products", action: () => setActiveView("all-products") },
    { icon: ListOrdered, label: "Orders", path: "/admin/orders" },
    { icon: Users, label: "Customers", path: "/admin/customers" },
    { icon: Tag, label: "Coupons", path: "/admin/coupons" },
    { icon: Megaphone, label: "Popups & Promos", path: "/admin/popups" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  const toggleShipping = async () => {
    setShippingLoading(true);
    try {
      const res = await fetchApi("/api/admin/branding/shipping", {
        method: "PUT",
        body: JSON.stringify({ enabled: !shippingEnabled }),
      });
      setShippingEnabled(res.shipping.enabled);
      setShippingCost(res.shipping.cost);
    } catch (err) {
      console.error("Failed to toggle shipping:", err);
    } finally {
      setShippingLoading(false);
    }
  };

  const updateShippingCost = async (newCost) => {
    try {
      const res = await fetchApi("/api/admin/branding/shipping", {
        method: "PUT",
        body: JSON.stringify({ cost: newCost }),
      });
      setShippingCost(res.shipping.cost);
    } catch (err) {
      console.error("Failed to update shipping cost:", err);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Admin Dashboard</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              // Determine if this item is active
              let isActive = false;
              if (item.path) {
                // For items with a path, check if current location matches
                isActive = location.pathname === item.path;
              } else if (item.action) {
                // For items with an action, check if activeView matches the label
                isActive = activeView === item.label.toLowerCase();
              }
              
              return (
                <li key={index}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      if (item.path) {
                        navigate(item.path);
                      } else if (item.action) {
                        item.action();
                      }
                      // Close sidebar on mobile after navigation
                      setSidebarOpen(false);
                    }}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t">
          <Button 
            variant="ghost" 
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="flex items-center justify-between p-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">
              {activeView === "dashboard" ? "Dashboard" : 
               activeView === "add-product" ? "Add New Product" :
               activeView === "all-products" ? "All Products" : "Dashboard"}
            </h1>
          </div>
        </header>

        {/* Dashboard content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {activeView === "dashboard" ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <MiniSummary />
              </div>

              {/* Shipping Toggle */}
              <Card className="p-5 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Truck className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Shipping Charges</h3>
                      <p className="text-sm text-muted-foreground">
                        {shippingEnabled ? `₹${shippingCost} flat rate applied to all orders` : "Free shipping for all orders"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {shippingEnabled && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">₹</span>
                        <input
                          type="number"
                          value={shippingCost}
                          onChange={(e) => setShippingCost(Number(e.target.value))}
                          onBlur={(e) => updateShippingCost(Number(e.target.value))}
                          className="w-20 border rounded-md px-2 py-1 text-sm text-center"
                          min="0"
                        />
                      </div>
                    )}
                    <button
                      onClick={toggleShipping}
                      disabled={shippingLoading}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
                        shippingEnabled ? "bg-primary" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          shippingEnabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Orders Overview</h2>
                    <OrdersChart />
                  </Card>
                </div>
                <div>
                  <RecentCustomizations />
                </div>
              </div>
            </>
          ) : activeView === "add-product" ? (
            <AddProductForm onProductAdded={() => setActiveView("all-products")} />
          ) : activeView === "all-products" ? (
            <AllProductsList />
          ) : null}
        </main>
      </div>
    </div>
  );
};

export default NewAdminDashboard;