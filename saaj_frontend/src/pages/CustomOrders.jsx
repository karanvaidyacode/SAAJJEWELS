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
  Download,
  RefreshCw,
  LayoutDashboard,
  Package,
  Users,
  LogOut,
  Menu,
  X,
  ListOrdered,
  DollarSign,
  Briefcase,
  Palette,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useNavigate, useLocation } from 'react-router-dom';

export default function CustomOrders() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [customOrders, setCustomOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);

  const adminToken = localStorage.getItem('adminToken');

  useEffect(() => {
    if (!adminToken) {
      navigate('/admin/login');
    }
  }, [adminToken, navigate]);

  if (!adminToken) {
    return null;
  }

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Package, label: 'Products', path: '/admin' },
    { icon: ListOrdered, label: 'Orders', path: '/admin/orders' },
    { icon: Users, label: 'Customers', path: '/admin/customers' },
    { icon: DollarSign, label: 'Payments', path: '/admin/payments' },
    { icon: Briefcase, label: 'Custom Orders', path: '/admin/custom-orders' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'custom-reference.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(url, '_blank');
    }
  };

  // Fetch all custom orders
  const fetchCustomOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/api/admin/custom-orders');
      const orders = Array.isArray(data) ? data : [];
      setCustomOrders(orders);
      setFilteredOrders(orders);
    } catch (error) {
      console.error('Error fetching custom orders:', error);
      setCustomOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomOrders();
  }, []);

  // Filter custom orders based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredOrders(customOrders);
    } else {
      const q = searchQuery.toLowerCase();
      const filtered = customOrders.filter(
        (order) =>
          (order.customerName && order.customerName.toLowerCase().includes(q)) ||
          (order.customerEmail && order.customerEmail.toLowerCase().includes(q)) ||
          (order.designDescription && order.designDescription.toLowerCase().includes(q)) ||
          (order.status && order.status.toLowerCase().includes(q))
      );
      setFilteredOrders(filtered);
    }
  }, [searchQuery, customOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const updatedOrder = await fetchApi(`/api/admin/custom-orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      setCustomOrders(
        customOrders.map((order) => (order.id === orderId ? updatedOrder : order))
      );
    } catch (error) {
      console.error('Error updating custom order status:', error);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this custom order?')) {
      try {
        await fetchApi(`/api/admin/custom-orders/${orderId}`, {
          method: 'DELETE',
        });
        setCustomOrders(customOrders.filter((order) => order.id !== orderId));
      } catch (error) {
        console.error('Error deleting custom order:', error);
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'design':
        return <Badge className="bg-blue-500 text-white">Design Phase</Badge>;
      case 'production':
        return <Badge className="bg-yellow-500 text-white">In Production</Badge>;
      case 'quality-check':
        return <Badge className="bg-purple-500 text-white">Quality Check</Badge>;
      case 'ready':
        return <Badge className="bg-green-500 text-white">Ready for Delivery</Badge>;
      case 'delivered':
        return <Badge className="bg-green-700 text-white">Delivered</Badge>;
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
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
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
              const isActive = location.pathname === item.path;
              return (
                <li key={index}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => {
                      navigate(item.path);
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
          <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
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
            <h1 className="text-xl font-semibold">Custom Order Management</h1>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={fetchCustomOrders}>
                <RefreshCw className="h-5 w-5" />
              </Button>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Custom Order
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Search */}
          <Card className="p-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search custom orders by customer, design, or status..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </Card>

          {/* Orders Table */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-4 text-sm font-medium text-gray-500">Order</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500">Customer</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500">Design</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500">Materials</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div className="font-medium">
                            #{typeof order.id === 'string' ? order.id.substring(0, 8) : order.id}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleDateString()
                              : 'N/A'}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium">{order.customerName || 'N/A'}</div>
                          <div className="text-sm text-gray-500">
                            {order.customerEmail || 'N/A'}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <div className="max-w-xs truncate font-medium">
                              {order.designDescription || 'N/A'}
                            </div>
                            {order.referenceImages && order.referenceImages.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {order.referenceImages.slice(0, 3).map((img, i) => (
                                  <div key={i} className="relative group shrink-0">
                                    <img
                                      src={img}
                                      className="w-8 h-8 object-cover rounded border"
                                      alt="Reference"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded gap-1">
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          handleDownload(
                                            img,
                                            `custom-order-${order.id}-ref-${i}.jpg`
                                          );
                                        }}
                                        className="p-0.5 hover:bg-white/20 rounded transition-colors"
                                        title="Download"
                                      >
                                        <Download className="h-2 w-2 text-white" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                {order.referenceImages.length > 3 && (
                                  <div className="w-8 h-8 rounded border bg-gray-100 flex items-center justify-center text-[10px] text-gray-500">
                                    +{order.referenceImages.length - 3}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {order.materials?.map((material, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {material}
                              </Badge>
                            )) || 'N/A'}
                          </div>
                        </td>
                        <td className="p-4">{getStatusBadge(order.status)}</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteOrder(order.id)}
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
                <div className="text-center py-12 text-gray-500">
                  <Palette className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium">No custom orders found</p>
                  <p className="text-sm mt-1">
                    {searchQuery
                      ? 'Try adjusting your search.'
                      : 'Custom orders will appear here when customers request them.'}
                  </p>
                </div>
              )}
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
