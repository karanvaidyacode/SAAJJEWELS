import React, { useState, useEffect } from "react";
import { Card } from "../../components/ui/card";
import { 
  Wallet, 
  PackageCheck, 
  ListOrdered, 
  Users 
} from "lucide-react";
import { fetchApi } from "../../lib/api";

const MiniSummary = () => {
  const [stats, setStats] = useState([
    {
      title: "Total Revenue",
      value: "₹0",
      // Removed change percentage
      icon: Wallet,
      color: "bg-blue-500",
    },
    {
      title: "Orders",
      value: "0",
      // Removed change percentage
      icon: ListOrdered,
      color: "bg-green-500",
    },
    {
      title: "Customers",
      value: "0",
      // Removed change percentage
      icon: Users,
      color: "bg-purple-500",
    },
    {
      title: "Products",
      value: "0",
      // Removed change percentage
      icon: PackageCheck,
      color: "bg-orange-500",
    },
  ]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch orders to get count and calculate revenue
        const ordersResponse = await fetchApi("/api/admin/orders/analytics");
        
        // Fetch customers to get count
        const customersResponse = await fetchApi("/api/admin/customers/analytics");
        
        // Fetch products to get count
        const products = await fetchApi("/api/products");
        
        // Calculate total revenue from orders
        const totalRevenue = ordersResponse.totalRevenue || 0;
        const totalOrders = ordersResponse.totalOrders || 0;
        const totalCustomers = customersResponse.totalCustomers || 0;
        
        // Update stats with real data (removed change percentages)
        setStats([
          {
            title: "Total Revenue",
            value: `₹${totalRevenue.toLocaleString()}`,
            // Removed change percentage
            icon: Wallet,
            color: "bg-blue-500",
          },
          {
            title: "Orders",
            value: totalOrders.toString(),
            // Removed change percentage
            icon: ListOrdered,
            color: "bg-green-500",
          },
          {
            title: "Customers",
            value: totalCustomers.toString(),
            // Removed change percentage
            icon: Users,
            color: "bg-purple-500",
          },
          {
            title: "Products",
            value: products.length.toString(),
            // Removed change percentage
            icon: PackageCheck,
            color: "bg-orange-500",
          },
        ]);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <h3 className="text-2xl font-bold">{stat.value}</h3>
                {/* Removed percentage display */}
              </div>
              <div className={`${stat.color} p-3 rounded-full`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
        );
      })}
    </>
  );
};

export default MiniSummary;