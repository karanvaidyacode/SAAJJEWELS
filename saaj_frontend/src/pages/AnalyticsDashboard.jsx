import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  DollarSign, 
  Calendar, 
  Filter,
  BarChart3,
  PieChart
} from 'lucide-react';

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    totalProducts: 0,
    ordersByStatus: {},
    revenueByCategory: {}
  });
  
  const [salesData, setSalesData] = useState([]);
  const [orderStats, setOrderStats] = useState([]);
  const [customerAnalytics, setCustomerAnalytics] = useState([]);
  const [productPerformance, setProductPerformance] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch stats
        const statsResponse = await fetch('/api/admin/analytics/dashboard');
        const statsData = await statsResponse.json();
        setStats(statsData);
        
        // Fetch sales data
        const salesResponse = await fetch('/api/admin/analytics/sales');
        const salesData = await salesResponse.json();
        setSalesData(salesData);
        
        // Fetch order stats
        const orderResponse = await fetch('/api/admin/analytics/orders');
        const orderData = await orderResponse.json();
        setOrderStats(orderData);
        
        // Fetch customer analytics
        const customerResponse = await fetch('/api/admin/analytics/customers');
        const customerData = await customerResponse.json();
        setCustomerAnalytics(customerData);
        
        // Fetch product performance
        const productResponse = await fetch('/api/admin/analytics/products');
        const productData = await productResponse.json();
        setProductPerformance(productData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Last 7 Days
          </Button>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading dashboard...</div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Total Orders</p>
                  <p className="text-2xl font-bold">{stats.totalOrders || 0}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue || 0)}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Total Customers</p>
                  <p className="text-2xl font-bold">{stats.totalCustomers || 0}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-full">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Total Products</p>
                  <p className="text-2xl font-bold">{stats.totalProducts || 0}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Charts and Reports */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Sales Overview</h2>
                <Button variant="outline" size="sm">
                  View Report
                </Button>
              </div>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                  <p>Sales chart visualization</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Order Status</h2>
                <Button variant="outline" size="sm">
                  View Report
                </Button>
              </div>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center text-gray-500">
                  <PieChart className="h-12 w-12 mx-auto mb-2" />
                  <p>Order status chart</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-4">
              <div className="flex items-center p-4 border rounded-lg">
                <div className="p-2 bg-blue-100 rounded-full">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="font-medium">New order received</p>
                  <p className="text-sm text-gray-500">Order #12345 for ₹2,500</p>
                </div>
                <div className="text-sm text-gray-500">2 min ago</div>
              </div>
              
              <div className="flex items-center p-4 border rounded-lg">
                <div className="p-2 bg-green-100 rounded-full">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="font-medium">Payment completed</p>
                  <p className="text-sm text-gray-500">Payment for order #12344</p>
                </div>
                <div className="text-sm text-gray-500">15 min ago</div>
              </div>
              
              <div className="flex items-center p-4 border rounded-lg">
                <div className="p-2 bg-purple-100 rounded-full">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="font-medium">New customer registered</p>
                  <p className="text-sm text-gray-500">John Doe joined</p>
                </div>
                <div className="text-sm text-gray-500">1 hour ago</div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}