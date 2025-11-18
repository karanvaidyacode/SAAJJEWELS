import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate, useParams } from "react-router-dom";
import { fetchApi } from '@/lib/api';
import { ArrowLeft, Package, User, MapPin, CreditCard } from 'lucide-react';

export default function OrderDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Fetch order details
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching order with ID:', id);
        
        if (!id) {
          throw new Error('Order ID is missing');
        }
        
        // Ensure we're using the correct ID format
        const actualOrderId = typeof id === 'object' ? id._id || id.id : id;
        console.log('Actual order ID:', actualOrderId);
        
        const response = await fetchApi(`/api/admin/orders/${actualOrderId}`, {
          headers: {
            "x-admin-token": adminToken
          }
        });
        
        console.log('Order response:', response);
        
        if (!response) {
          throw new Error('No response received from server');
        }
        
        setOrder(response);
      } catch (err) {
        console.error('Error fetching order:', err);
        // Convert error to string message
        let errorMessage = 'Failed to load order details';
        if (err.message) {
          errorMessage = err.message;
        } else if (typeof err === 'object' && err !== null) {
          errorMessage = JSON.stringify(err);
        } else if (err.toString) {
          errorMessage = err.toString();
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    } else {
      setError('Order ID is missing');
      setLoading(false);
    }
  }, [id, adminToken]);

  const handleStatusChange = async (newStatus) => {
    try {
      // Use the correct ID format (might be _id from MongoDB)
      const actualOrderId = order.id || order._id || id;
      
      const response = await fetchApi(`/api/admin/orders/${actualOrderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          "x-admin-token": adminToken
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.success) {
        setOrder({ ...order, status: newStatus });
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

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error loading order</div>
          <p className="text-gray-600 mb-6">{error || 'Order not found'}</p>
          <Button onClick={() => navigate('/admin/orders')}>Back to Orders</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/admin/orders')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold">Order Details</h1>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Order #{order.orderNumber || order.id?.substring(0, 8)}</h1>
              <p className="text-gray-600">View and manage order details</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Order Summary */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order Number:</span>
                      <span className="font-medium">#{order.orderNumber || order.id?.substring(0, 8)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order Date:</span>
                      <span className="font-medium">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">{order.status || 'N/A'}</span>
                        <select 
                          value={order.status || ''}
                          onChange={(e) => handleStatusChange(e.target.value)}
                          className="text-sm border rounded px-2 py-1"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Status:</span>
                      <span className="font-medium capitalize">{order.paymentStatus || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="font-medium capitalize">{order.paymentMethod || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between pt-4 border-t">
                      <span className="text-lg font-semibold">Total Amount:</span>
                      <span className="text-lg font-bold">₹{(Number(order.totalAmount) || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </Card>

                {/* Items */}
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Items</h2>
                  <div className="space-y-4">
                    {order.items && order.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="w-16 h-16 rounded-md overflow-hidden">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name || "Product"}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = '<div class="bg-gray-200 border-2 border-dashed rounded-xl w-full h-full flex items-center justify-center"><span class="text-xs text-gray-500">No Image</span></div>';
                              }}
                            />
                          ) : (
                            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-full flex items-center justify-center">
                              <span className="text-xs text-gray-500">No Image</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{item.name}</h3>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                          <p className="text-sm text-gray-600">Price: ₹{(Number(item.price) || 0).toFixed(2)}</p>
                        </div>
                        <div className="font-medium">₹{((Number(item.price) || 0) * (item.quantity || 0)).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Customer Information */}
              <div className="space-y-6">
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="font-medium">{order.customerName || 'N/A'}</div>
                        <div className="text-sm text-gray-600">{order.customerEmail || 'N/A'}</div>
                        {order.customerPhone && (
                          <div className="text-sm text-gray-600">{order.customerPhone}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="text-sm">
                      {order.shippingAddress || 'N/A'}
                    </div>
                  </div>
                </Card>

                {order.razorpayOrderId && (
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Payment Information</h2>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Razorpay Order ID:</span>
                        <span className="font-medium text-sm">{order.razorpayOrderId}</span>
                      </div>
                      {order.razorpayPaymentId && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Razorpay Payment ID:</span>
                          <span className="font-medium text-sm">{order.razorpayPaymentId}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}