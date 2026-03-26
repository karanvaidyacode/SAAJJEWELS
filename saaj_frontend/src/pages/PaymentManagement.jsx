import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Eye,
  CreditCard,
  Wallet,
  IndianRupee,
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
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useNavigate, useLocation } from 'react-router-dom';

export default function PaymentManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // Admin auth is handled by AdminProtectedRoute wrapper in App.jsx
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

  // Fetch all payments
  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/api/admin/payments');
      setPayments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch payment analytics
  const fetchAnalytics = async () => {
    try {
      const data = await fetchApi('/api/admin/payments/analytics');
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching payment analytics:', error);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchAnalytics();
  }, []);

  // Filter payments based on search query and status
  useEffect(() => {
    let filtered = payments;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (payment) =>
          (payment.id && String(payment.id).toLowerCase().includes(q)) ||
          (payment.orderNumber && payment.orderNumber.toLowerCase().includes(q)) ||
          (payment.customerName && payment.customerName.toLowerCase().includes(q)) ||
          (payment.customerEmail && payment.customerEmail.toLowerCase().includes(q)) ||
          (payment.method && payment.method.toLowerCase().includes(q)) ||
          (payment.razorpayPaymentId && payment.razorpayPaymentId.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        (payment) => payment.status?.toLowerCase() === statusFilter
      );
    }

    setFilteredPayments(filtered);
  }, [searchQuery, statusFilter, payments]);

  const getMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'razorpay':
        return <Wallet className="h-4 w-4" />;
      case 'cod':
        return <IndianRupee className="h-4 w-4" />;
      case 'paypal':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return <Badge className="bg-green-500 text-white">Paid</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'refunded':
        return <Badge className="bg-yellow-500 text-white">Refunded</Badge>;
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
            <h1 className="text-xl font-semibold">Payment Management</h1>
            <Button variant="ghost" size="icon" onClick={() => { fetchPayments(); fetchAnalytics(); }}>
              <RefreshCw className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Analytics Cards */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Payments</p>
                    <h3 className="text-2xl font-bold">{analytics.totalPayments || 0}</h3>
                  </div>
                  <div className="bg-blue-500 p-3 rounded-full">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Collected</p>
                    <h3 className="text-2xl font-bold">₹{(analytics.totalCollected || 0).toLocaleString()}</h3>
                  </div>
                  <div className="bg-green-500 p-3 rounded-full">
                    <IndianRupee className="h-6 w-6 text-white" />
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pending Amount</p>
                    <h3 className="text-2xl font-bold">₹{(analytics.totalPending || 0).toLocaleString()}</h3>
                  </div>
                  <div className="bg-yellow-500 p-3 rounded-full">
                    <Wallet className="h-6 w-6 text-white" />
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Paid Orders</p>
                    <h3 className="text-2xl font-bold">{analytics.statusCounts?.paid || 0}</h3>
                  </div>
                  <div className="bg-purple-500 p-3 rounded-full">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Search & Filter */}
          <Card className="p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by order number, customer, Razorpay ID..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Payments Table */}
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
                      <th className="text-left p-4 text-sm font-medium text-gray-500">Order #</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500">Customer</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500">Date</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500">Method</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500">Amount</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500">Razorpay ID</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div className="font-medium text-sm">
                            {payment.orderNumber || `#${payment.id}`}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-sm">{payment.customerName || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{payment.customerEmail || 'N/A'}</div>
                        </td>
                        <td className="p-4 text-sm">
                          {payment.createdAt
                            ? new Date(payment.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'N/A'}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-sm">
                            {getMethodIcon(payment.method)}
                            <span className="capitalize">{payment.method || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-sm">
                            ₹{payment.amount?.toFixed(2) || '0.00'}
                          </div>
                        </td>
                        <td className="p-4">{getStatusBadge(payment.status)}</td>
                        <td className="p-4">
                          <div className="text-xs text-gray-500 font-mono truncate max-w-[120px]">
                            {payment.razorpayPaymentId || '—'}
                          </div>
                        </td>
                        <td className="p-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/orders/${payment.orderId}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredPayments.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <CreditCard className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium">No payments found</p>
                  <p className="text-sm mt-1">
                    {searchQuery || statusFilter !== 'all'
                      ? 'Try adjusting your search or filter.'
                      : 'Payments will appear here when orders are placed.'}
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
