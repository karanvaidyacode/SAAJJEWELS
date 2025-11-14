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
  Truck, 
  MapPin,
  Package,
  Calendar
} from 'lucide-react';

export default function ShippingDashboard() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredShipments, setFilteredShipments] = useState([]);

  // Fetch all shipments
  useEffect(() => {
    const fetchShipments = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/admin/shipping');
        const data = await response.json();
        setShipments(data);
        setFilteredShipments(data);
      } catch (error) {
        console.error('Error fetching shipments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchShipments();
  }, []);

  // Filter shipments based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredShipments(shipments);
    } else {
      const filtered = shipments.filter(shipment => 
        (shipment.trackingNumber && shipment.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (shipment.carrier && shipment.carrier.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (shipment.destination && shipment.destination.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (shipment.status && shipment.status.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredShipments(filtered);
    }
  }, [searchQuery, shipments]);

  const handleStatusChange = async (shipmentId, newStatus) => {
    try {
      const response = await fetch(`/api/admin/shipping/${shipmentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        const updatedShipment = await response.json();
        setShipments(shipments.map(shipment => 
          shipment.id === shipmentId ? updatedShipment : shipment
        ));
      }
    } catch (error) {
      console.error('Error updating shipment status:', error);
    }
  };

  const handleDeleteShipment = async (shipmentId) => {
    if (window.confirm('Are you sure you want to delete this shipment?')) {
      try {
        const response = await fetch(`/api/admin/shipping/${shipmentId}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          setShipments(shipments.filter(shipment => shipment.id !== shipmentId));
        }
      } catch (error) {
        console.error('Error deleting shipment:', error);
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'picked':
        return <Badge className="bg-blue-500">Picked Up</Badge>;
      case 'in-transit':
        return <Badge className="bg-yellow-500">In Transit</Badge>;
      case 'out-for-delivery':
        return <Badge className="bg-purple-500">Out for Delivery</Badge>;
      case 'delivered':
        return <Badge className="bg-green-500">Delivered</Badge>;
      case 'returned':
        return <Badge variant="destructive">Returned</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Shipping & Delivery</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Shipment
        </Button>
      </div>

      <Card className="p-6 mb-6">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search shipments by tracking number, carrier, or destination..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="text-center py-8">Loading shipments...</div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Tracking</th>
                  <th className="text-left p-4">Carrier</th>
                  <th className="text-left p-4">Destination</th>
                  <th className="text-left p-4">Date</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredShipments.map((shipment) => (
                  <tr key={shipment.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div className="font-medium">#{shipment.trackingNumber?.substring(0, 12) || 'N/A'}</div>
                      <div className="text-sm text-gray-500">
                        Order: #{shipment.orderId?.substring(0, 8) || 'N/A'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center">
                        <Truck className="h-4 w-4 mr-2" />
                        {shipment.carrier || 'N/A'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        <div className="max-w-xs truncate">
                          {shipment.destination || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {shipment.createdAt ? new Date(shipment.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(shipment.status)}
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
                          onClick={() => handleDeleteShipment(shipment.id)}
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
          
          {filteredShipments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No shipments found
            </div>
          )}
        </Card>
      )}
    </div>
  );
}