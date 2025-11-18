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
  X
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import Stats from "./dashboard-components/Stats";
import MiniSummary from "./dashboard-components/MiniSummary";
import TopSellingProducts from "./dashboard-components/TopSellingProducts";
import OrdersChart from "./dashboard-components/OrdersChart";
import ProductManagement from "./dashboard-components/ProductManagement";

const NewAdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState("dashboard"); // dashboard or products

  // Check if admin is authenticated
  const adminToken = localStorage.getItem("adminToken");
  
  // If no admin token or incorrect token, redirect to admin login
  useEffect(() => {
    if (!adminToken || adminToken !== "saaj123") {
      navigate("/admin/login");
    }
  }, [adminToken, navigate]);
  
  // If no admin token or incorrect token, don't render the dashboard
  if (!adminToken || adminToken !== "saaj123") {
    return null;
  }

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", action: () => setActiveView("dashboard") },
    { icon: Package, label: "Products", action: () => setActiveView("products") },
    { icon: ListOrdered, label: "Orders", path: "/admin/orders" },
    { icon: Users, label: "Customers", path: "/admin/customers" },
  ];

  const handleLogout = () => {
    // Clear admin token from localStorage
    localStorage.removeItem("adminToken");
    // Navigate to admin login page
    navigate("/admin/login");
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
            <h1 className="text-xl font-semibold">Dashboard</h1>
          </div>
        </header>

        {/* Dashboard content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {activeView === "dashboard" ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <MiniSummary />
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Orders Overview</h2>
                  <OrdersChart />
                </Card>
              </div>
            </>
          ) : (
            <ProductManagement />
          )}
        </main>
      </div>
    </div>
  );
};

export default NewAdminDashboard;