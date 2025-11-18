import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Search, Filter, Eye, CreditCard, Wallet, IndianRupee } from 'lucide-react';

export default function PaymentManagement() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredPayments, setFilteredPayments] = useState([]);

  // Fetch all payments
  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/admin/payments');
        const data = await response.json();
        setPayments(data);
        setFilteredPayments(data);
      } catch (error) {
        console.error('Error fetching payments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  // Filter payments based on search query and status
  useEffect(() => {
    let filtered = payments;
    
    if (searchQuery) {
      filtered = filtered.filter(payment => 
        (payment.id && payment.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (payment.customerEmail && payment.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (payment.method && payment.method.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => 
        payment.status?.toLowerCase() === statusFilter
      );
    }
    
    setFilteredPayments(filtered);
  }, [searchQuery, statusFilter, payments]);

  const getMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'credit_card':
      case 'debit_card':
        return <CreditCard className="h-4 w-4" />;
      case 'razorpay':
        return <Wallet className="h-4 w-4" />;
      case 'cod':
        return <IndianRupee className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'refunded':
        return <Badge className="bg-yellow-500">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Payment Management</h1>
        <Button>
          <CreditCard className="mr-2 h-4 w-4" />
          Process Payment
        </Button>
      </div>

      <Card className="p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search payments by ID, customer, or method..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Filter className="h-5 w-5 text-gray-400 mt-2" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </Select>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="text-center py-8">Loading payments...</div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Payment ID</th>
                  <th className="text-left p-4">Customer</th>
                  <th className="text-left p-4">Date</th>
                  <th className="text-left p-4">Method</th>
                  <th className="text-left p-4">Amount</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div className="font-medium">#{payment.id?.substring(0, 8)}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{payment.customerName || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{payment.customerEmail || 'N/A'}</div>
                    </td>
                    <td className="p-4">
                      {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center">
                        {getMethodIcon(payment.method)}
                        <span className="ml-2">{payment.method || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">₹{payment.amount?.toFixed(2) || '0.00'}</div>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredPayments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No payments found
            </div>
          )}
        </Card>
      )}
    </div>
  );
}