import React, { useState, useEffect } from "react";
import { fetchApi } from "../../lib/api";

const TopSellingProducts = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        // Fetch products from the API
        const allProducts = await fetchApi("/api/products");
        
        // For now, we'll just take the first 5 products as examples
        // In a real implementation, you would have sales data to determine top products
        const topProducts = allProducts.slice(0, 5).map(product => ({
          id: product.id || product._id,
          name: product.name,
          sales: Math.floor(Math.random() * 1000) + 100, // Random sales for demo
          revenue: `₹${(product.discountedPrice || product.originalPrice || 0).toLocaleString()}`,
          price: product.discountedPrice || product.originalPrice || 0
        }));
        
        // Sort by price (highest first) as a proxy for popularity
        topProducts.sort((a, b) => b.price - a.price);
        
        setProducts(topProducts);
      } catch (error) {
        console.error("Error fetching top products:", error);
        // Fallback to sample data
        setProducts([
          {
            name: "Gold Plated Necklace",
            sales: 1234,
            revenue: "₹12,340",
          },
          {
            name: "Diamond Earrings",
            sales: 987,
            revenue: "₹25,670",
          },
          {
            name: "Silver Bracelet",
            sales: 756,
            revenue: "₹7,560",
          },
          {
            name: "Platinum Ring",
            sales: 543,
            revenue: "₹18,900",
          },
          {
            name: "Rose Gold Pendant",
            sales: 432,
            revenue: "₹8,640",
          },
        ]);
      }
    };

    fetchTopProducts();
  }, []);

  return (
    <div className="space-y-4">
      {products.map((product, index) => (
        <div key={index} className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">{product.name}</h4>
            <p className="text-sm text-gray-500">{product.sales} sales</p>
          </div>
          <p className="font-medium">{product.revenue}</p>
        </div>
      ))}
    </div>
  );
};

export default TopSellingProducts;