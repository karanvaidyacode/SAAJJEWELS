import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit, Trash2, Eye, Palette } from 'lucide-react';

export default function CustomOrders() {
  const [customOrders, setCustomOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);

  // Fetch all custom orders
  useEffect(() => {
    const fetchCustomOrders = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/admin/custom-orders');
        const data = await response.json();
        setCustomOrders(data);
        setFilteredOrders(data);
      } catch (error) {
        console.error('Error fetching custom orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomOrders();
  }, []);

  // Filter custom orders based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredOrders(customOrders);
    } else {
      const filtered = customOrders.filter(order => 
        (order.customerName && order.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (order.customerEmail && order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (order.designDescription && order.designDescription.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (order.status && order.status.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredOrders(filtered);
    }
  }, [searchQuery, customOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const response = await fetch(`/api/admin/custom-orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        const updatedOrder = await response.json();
        setCustomOrders(customOrders.map(order => 
          order.id === orderId ? updatedOrder : order
        ));
      }
    } catch (error) {
      console.error('Error updating custom order status:', error);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this custom order?')) {
      try {
        const response = await fetch(`/api/admin/custom-orders/${orderId}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          setCustomOrders(customOrders.filter(order => order.id !== orderId));
        }
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
        return <Badge className="bg-blue-500">Design Phase</Badge>;
      case 'production':
        return <Badge className="bg-yellow-500">In Production</Badge>;
      case 'quality-check':
        return <Badge className="bg-purple-500">Quality Check</Badge>;
      case 'ready':
        return <Badge className="bg-green-500">Ready for Delivery</Badge>;
      case 'delivered':
        return <Badge className="bg-green-700">Delivered</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Custom Order Management</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Custom Order
        </Button>
      </div>

      <Card className="p-6 mb-6">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search custom orders by customer, design, or status..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="text-center py-8">Loading custom orders...</div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Order</th>
                  <th className="text-left p-4">Customer</th>
                  <th className="text-left p-4">Design</th>
                  <th className="text-left p-4">Materials</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div className="font-medium">#{order.id?.substring(0, 8)}</div>
                      <div className="text-sm text-gray-500">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{order.customerName || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{order.customerEmail || 'N/A'}</div>
                    </td>
                    <td className="p-4">
                      <div className="max-w-xs truncate">{order.designDescription || 'N/A'}</div>
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
                    <td className="p-4">
                      {getStatusBadge(order.status)}
                    </td>
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
            <div className="text-center py-8 text-gray-500">
              No custom orders found
            </div>
          )}
        </Card>
      )}
    </div>
  );
}