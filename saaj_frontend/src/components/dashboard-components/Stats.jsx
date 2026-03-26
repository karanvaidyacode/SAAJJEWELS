import React, { useEffect, useState } from "react";
import { formatNumber } from "../../lib/helper";
import { fetchApi } from "../../lib/api";

const Stats = () => {
  const [stats, setStats] = useState([
    { name: "Total Revenue", value: 0 },
    { name: "Products", value: 0 },
    { name: "Categories", value: 0 },
    { name: "Active Now", value: 0 },
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch products to get count and calculate revenue
        const products = await fetchApi("/api/products");
        
        // Calculate total revenue
        const totalRevenue = products.reduce((sum, product) => {
          const price = product.discountedPrice || product.originalPrice || 0;
          return sum + (parseFloat(price) || 0);
        }, 0);
        
        // Get unique categories
        const categories = [...new Set(products.map(product => product.category))];
        
        setStats([
          { name: "Total Revenue", value: totalRevenue },
          { name: "Products", value: products.length },
          { name: "Categories", value: categories.length },
          { name: "Active Now", value: 1243 },
        ]);
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">{stat.name}</h3>
          <p className="text-2xl font-bold">
            {stat.name === "Total Revenue" ? "₹" : ""}
            {formatNumber(stat.value)}
          </p>
        </div>
      ))}
    </div>
  );
};

export default Stats;