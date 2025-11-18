import React, { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { fetchApi } from "../../lib/api";

const TopProductsChart = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchProductCategories = async () => {
      try {
        // Fetch products from the API
        const products = await fetchApi("/api/products");
        
        // Count products by category
        const categoryCount = {};
        products.forEach(product => {
          const category = product.category || "Unknown";
          categoryCount[category] = (categoryCount[category] || 0) + 1;
        });
        
        // Convert to chart data format
        const chartData = Object.entries(categoryCount).map(([name, value]) => ({
          name,
          value
        }));
        
        // Sort by value (descending) and take top 5
        chartData.sort((a, b) => b.value - a.value);
        const topCategories = chartData.slice(0, 5);
        
        setData(topCategories);
      } catch (error) {
        console.error("Error fetching product categories:", error);
        // Fallback to sample data
        const newData = [
          { name: "Necklaces", value: 400 },
          { name: "Earrings", value: 300 },
          { name: "Rings", value: 300 },
          { name: "Bracelets", value: 200 },
          { name: "Pendants", value: 100 },
        ];
        setData(newData);
      }
    };

    fetchProductCategories();
  }, []);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TopProductsChart;