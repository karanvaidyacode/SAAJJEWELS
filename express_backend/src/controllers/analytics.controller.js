const { pineconeIndex } = require('../utils/pinecone');

// In-memory data for analytics (in production, you might want to use a database)
let analyticsData = {
  totalOrders: 0,
  totalRevenue: 0,
  totalCustomers: 0,
  totalProducts: 0,
  ordersByStatus: {},
  revenueByCategory: {},
  topSellingProducts: [],
  customerGrowth: []
};

// Remove Pinecone references and replace with PostgreSQL-based logic
const { User } = require('../models/postgres');

// Mock data for analytics since we're removing Pinecone
const mockAnalyticsData = {
  totalRevenue: 12345.67,
  totalOrders: 123,
  totalCustomers: 456,
  avgOrderValue: 100.37,
  conversionRate: 3.2,
  topProducts: [
    { name: "Diamond Ring", sales: 25 },
    { name: "Gold Necklace", sales: 20 },
    { name: "Silver Earrings", sales: 18 },
  ],
  salesData: [
    { month: "Jan", revenue: 1200 },
    { month: "Feb", revenue: 1900 },
    { month: "Mar", revenue: 1500 },
    { month: "Apr", revenue: 2100 },
    { month: "May", revenue: 1800 },
    { month: "Jun", revenue: 2400 },
  ]
};

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    res.json(analyticsData);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get dashboard analytics
exports.getDashboardAnalytics = async (req, res) => {
  try {
    // In a real implementation, you would fetch this data from MongoDB
    res.json(mockAnalyticsData);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
};

// Get sales data
exports.getSalesData = async (req, res) => {
  try {
    // In a real implementation, you would fetch this data from MongoDB
    res.json(mockAnalyticsData.salesData);
  } catch (error) {
    console.error('Error fetching sales data:', error);
    res.status(500).json({ message: 'Error fetching sales data', error: error.message });
  }
};

// Get order statistics
exports.getOrderStats = async (req, res) => {
  try {
    // In a real application, this would fetch data from your database
    // For now, we'll return sample data
    const orderStats = {
      totalOrders: 124,
      pendingOrders: 23,
      completedOrders: 95,
      cancelledOrders: 6,
      orderTrend: [
        { date: '2023-01-01', count: 12 },
        { date: '2023-01-02', count: 15 },
        { date: '2023-01-03', count: 18 },
        { date: '2023-01-04', count: 14 },
        { date: '2023-01-05', count: 20 }
      ]
    };
    
    res.json(orderStats);
  } catch (error) {
    console.error("Error fetching order stats:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get top products
exports.getTopProducts = async (req, res) => {
  try {
    // In a real implementation, you would fetch this data from MongoDB
    res.json(mockAnalyticsData.topProducts);
  } catch (error) {
    console.error('Error fetching top products:', error);
    res.status(500).json({ message: 'Error fetching top products', error: error.message });
  }
};

// Get customer analytics
exports.getCustomerAnalytics = async (req, res) => {
  try {
    // In a real implementation, you would fetch this data from MongoDB
    res.json({
      totalCustomers: mockAnalyticsData.totalCustomers,
      newCustomers: 45,
      returningCustomers: 12,
      customerGrowth: [
        { month: "Jan", new: 30, returning: 5 },
        { month: "Feb", new: 35, returning: 8 },
        { month: "Mar", new: 25, returning: 10 },
        { month: "Apr", new: 40, returning: 7 },
        { month: "May", new: 38, returning: 12 },
        { month: "Jun", new: 45, returning: 15 },
      ]
    });
  } catch (error) {
    console.error('Error fetching customer analytics:', error);
    res.status(500).json({ message: 'Error fetching customer analytics', error: error.message });
  }
};

// Get product performance data
exports.getProductPerformance = async (req, res) => {
  try {
    // In a real application, this would fetch data from your database
    // For now, we'll return sample data
    const productPerformance = {
      topSellingProducts: [
        { name: 'Gold Necklace', sales: 42, revenue: 126000 },
        { name: 'Diamond Earrings', sales: 38, revenue: 95000 },
        { name: 'Silver Bracelet', sales: 35, revenue: 52500 },
        { name: 'Pearl Ring', sales: 30, revenue: 45000 }
      ],
      categoryPerformance: [
        { category: 'Necklaces', sales: 65, revenue: 195000 },
        { category: 'Earrings', sales: 52, revenue: 130000 },
        { category: 'Bracelets', sales: 48, revenue: 72000 },
        { category: 'Rings', sales: 42, revenue: 63000 }
      ]
    };
    
    res.json(productPerformance);
  } catch (error) {
    console.error("Error fetching product performance:", error);
    res.status(500).json({ error: error.message });
  }
};

// Search analytics data using vector similarity
exports.searchAnalytics = async (req, res) => {
  try {
    const { query, topK = 10 } = req.body;
    
    // Convert query to vector (simplified for demo)
    const vector = new Array(1536).fill(0);
    const hash = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash);
    };
    
    const text = query.toLowerCase();
    for (let i = 0; i < Math.min(10, text.length); i++) {
      const index = hash(text.substring(i, i + 5)) % 1536;
      vector[index] = (vector[index] || 0) + 1;
    }
    
    // Query Pinecone
    const queryRequest = {
      vector: vector,
      topK: parseInt(topK),
      includeMetadata: true
    };
    
    const response = await pineconeIndex.query(queryRequest);
    
    res.json(response.matches);
  } catch (error) {
    console.error("Error searching analytics data:", error);
    res.status(500).json({ error: error.message });
  }
};

// Update analytics data (for demo purposes)
exports.updateAnalytics = async (req, res) => {
  try {
    const { data } = req.body;
    
    // Update analytics data
    analyticsData = {
      ...analyticsData,
      ...data
    };
    
    res.json({ success: true, message: "Analytics data updated" });
  } catch (error) {
    console.error("Error updating analytics data:", error);
    res.status(500).json({ error: error.message });
  }
};