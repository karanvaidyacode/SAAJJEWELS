import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  RefreshCw,
  LayoutDashboard, 
  Package, 
  Users, 
  LogOut,
  Menu,
  X,
  ListOrdered,
  Copy
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function OrderManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);

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
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
    { icon: Package, label: "Products", path: "/admin" }, // Navigate to main admin which has products view
    { icon: ListOrdered, label: "Orders", path: "/admin/orders" }, // Current page
    { icon: Users, label: "Customers", path: "/admin/customers" },
  ];

  const handleLogout = () => {
    // Clear admin token from localStorage
    localStorage.removeItem("adminToken");
    // Navigate to admin login page
    navigate("/admin/login");
  };

  // Fetch all orders
  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Get admin token from localStorage
      const adminToken = localStorage.getItem("adminToken");
      
      console.log('Fetching orders with admin token:', adminToken);
      const response = await fetchApi("/api/admin/orders", {
        headers: {
          "x-admin-token": adminToken
        }
      });
      
      console.log('Orders response:', response);
      const data = Array.isArray(response) ? response : [];
      console.log('Processed orders data:', data);
      
      // Add id field if it doesn't exist (for compatibility with frontend)
      const processedData = data.map(order => ({
        ...order,
        id: order.id || order._id  // Use _id if id doesn't exist
      }));
      
      setOrders(processedData);
      setFilteredOrders(processedData);
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Convert error to string message
      let errorMessage = 'Failed to fetch orders';
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      } else if (error.toString) {
        errorMessage = error.toString();
      }
      alert(`Error fetching orders: ${errorMessage}`);
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter orders based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter(order => 
        (order.orderNumber && order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (order.customerName && order.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (order.customerEmail && order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (order.status && order.status.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredOrders(filtered);
    }
  }, [searchQuery, orders]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      // Get admin token from localStorage
      const adminToken = localStorage.getItem("adminToken");
      
      // Use the correct ID format (might be _id from MongoDB)
      const actualOrderId = typeof orderId === 'object' ? orderId._id || orderId.id : orderId;
      
      const response = await fetchApi(`/api/admin/orders/${actualOrderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          "x-admin-token": adminToken
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.success) {
        const updatedOrder = response.order;
        setOrders(orders.map(order => 
          (order.id || order._id) === actualOrderId ? updatedOrder : order
        ));
        setFilteredOrders(filteredOrders.map(order => 
          (order.id || order._id) === actualOrderId ? updatedOrder : order
        ));
      } else {
        throw new Error(response.message || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      // Convert error to string message
      let errorMessage = 'Failed to update order status';
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      } else if (error.toString) {
        errorMessage = error.toString();
      }
      alert(`Error updating order status: ${errorMessage}`);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        // Get admin token from localStorage
        const adminToken = localStorage.getItem("adminToken");
        
        console.log('Deleting order with ID:', orderId);
        // Use the correct ID format (might be _id from MongoDB)
        const actualOrderId = typeof orderId === 'object' ? orderId._id || orderId.id : orderId;
        console.log('Actual order ID:', actualOrderId);
        
        const response = await fetchApi(`/api/admin/orders/${actualOrderId}`, {
          method: 'DELETE',
          headers: {
            "x-admin-token": adminToken
          }
        });
        
        console.log('Delete response:', response);
        
        if (response.success) {
          setOrders(orders.filter(order => (order.id || order._id) !== actualOrderId));
          setFilteredOrders(filteredOrders.filter(order => (order.id || order._id) !== actualOrderId));
          // Show success message
          console.log('Order deleted successfully');
        } else {
          throw new Error(response.message || 'Failed to delete order');
        }
      } catch (error) {
        console.error('Error deleting order:', error);
        // Convert error to string message
        let errorMessage = 'Failed to delete order';
        if (error.message) {
          errorMessage = error.message;
        } else if (typeof error === 'object' && error !== null) {
          errorMessage = JSON.stringify(error);
        } else if (error.toString) {
          errorMessage = error.toString();
        }
        alert(`Error deleting order: ${errorMessage}`);
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500">Processing</Badge>;
      case 'shipped':
        return <Badge className="bg-yellow-500">Shipped</Badge>;
      case 'delivered':
        return <Badge className="bg-green-500">Delivered</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>;
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
              const isActive = item.path ? location.pathname === item.path : false; // Current page
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
            <h1 className="text-xl font-semibold">Order Management</h1>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Order Management</h1>
              <p className="text-gray-600">Manage and track customer orders</p>
            </div>
            
          </div>

          <Card className="p-6 mb-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search orders by order number, customer, or status..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={fetchOrders} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </Card>

          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              <p className="mt-2 text-gray-500">Loading orders...</p>
            </div>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">Order Number</th>
                      <th className="text-left p-4">Customer</th>
                      <th className="text-left p-4">Date</th>
                      <th className="text-left p-4">Total</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-left p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">#{order.orderNumber || order.id?.substring(0, 8)}</span>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                const orderNumber = order.orderNumber || order.id?.substring(0, 8);
                                navigator.clipboard.writeText(orderNumber);
                                toast({
                                  title: "Order number copied",
                                  description: `Order number ${orderNumber} has been copied to clipboard`,
                                });
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium">{order.customerName || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{order.customerEmail || 'N/A'}</div>
                        </td>
                        <td className="p-4">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-4">
                          ₹{(Number(order.totalAmount) || 0).toFixed(2)}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(order.status)}
                            <select 
                              value={order.status || ''}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              className="text-sm border rounded px-2 py-1"
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                const actualOrderId = order.id || order._id;
                                navigate(`/admin/orders/${actualOrderId}`);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                // Navigate to order details page for editing
                                const actualOrderId = order.id || order._id;
                                navigate(`/admin/orders/${actualOrderId}`);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDeleteOrder(order.id || order._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredOrders.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No orders found
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}