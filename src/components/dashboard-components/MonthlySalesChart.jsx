import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fetchApi } from "../../lib/api";

const MonthlySalesChart = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        // Fetch products from the API
        const products = await fetchApi("/api/products");
        
        // Generate data for the last 6 months
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
        
        // Calculate total revenue for all products
        const totalRevenue = products.reduce((sum, product) => {
          const price = product.discountedPrice || product.originalPrice || 0;
          return sum + (parseFloat(price) || 0);
        }, 0);
        
        // Distribute revenue across months (in a real app, this would come from actual sales data)
        const newData = months.map((month, index) => ({
          name: month,
          sales: Math.floor(Math.random() * products.length * 10) + (products.length * 5),
          revenue: Math.floor(totalRevenue / 6) + Math.floor(Math.random() * 50000),
        }));
        
        setData(newData);
      } catch (error) {
        console.error("Error fetching sales data:", error);
        // Fallback to sample data
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
        const newData = months.map((month, index) => ({
          name: month,
          sales: Math.floor(Math.random() * 5000) + 1000,
          revenue: Math.floor(Math.random() * 100000) + 50000,
        }));
        setData(newData);
      }
    };

    fetchSalesData();
  }, []);

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="revenue"
            stackId="1"
            stroke="#8884d8"
            fill="#8884d8"
          />
          <Area
            type="monotone"
            dataKey="sales"
            stackId="1"
            stroke="#82ca9d"
            fill="#82ca9d"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlySalesChart;