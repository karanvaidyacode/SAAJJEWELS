import React, { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Eye, MessageSquare, Image as ImageIcon, Download } from "lucide-react";
import { fetchApi } from "../../lib/api";
import { useNavigate } from "react-router-dom";

const RecentCustomizations = () => {
  const [customizations, setCustomizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'customization-photo.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback: open in new tab if fetch fails
      window.open(url, '_blank');
    }
  };

  useEffect(() => {
    const fetchCustomizations = async () => {
      try {
        setLoading(true);
        const adminToken = localStorage.getItem("adminToken");
        const orders = await fetchApi("/api/admin/orders", {
          headers: {
            "x-admin-token": adminToken
          }
        });

        const allCustomizations = [];
        
        if (Array.isArray(orders)) {
          orders.forEach(order => {
            if (order.items && Array.isArray(order.items)) {
              order.items.forEach(item => {
                if (item.customRequest || (item.customPhotos && item.customPhotos.length > 0)) {
                  allCustomizations.push({
                    orderId: order.id || order._id,
                    orderNumber: order.orderNumber,
                    customerName: order.customerName,
                    productName: item.name,
                    message: item.customRequest,
                    photos: item.customPhotos || [],
                    date: order.createdAt
                  });
                }
              });
            }
          });
        }

        // Sort by date descending and take top 5
        const sorted = allCustomizations.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
        setCustomizations(sorted);
      } catch (error) {
        console.error("Error fetching customizations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomizations();
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Customizations</h2>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  if (customizations.length === 0) {
    return null; // Don't show if no customizations
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Customization Requests</h2>
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
          {customizations.length} New Requests
        </Badge>
      </div>
      
      <div className="space-y-4">
        {customizations.map((cust, index) => (
          <div key={index} className="p-4 border rounded-lg bg-white hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-bold text-sm text-primary">#{cust.orderNumber || cust.orderId?.substring(0, 8)}</p>
                <p className="text-xs text-gray-500">{cust.customerName}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => navigate(`/admin/orders/${cust.orderId}`)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="mb-3">
              <p className="text-sm font-medium mb-1">{cust.productName}</p>
              {cust.message && (
                <div className="flex items-start gap-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                  <MessageSquare className="h-4 w-4 mt-0.5 text-gray-400 shrink-0" />
                  <p className="italic">{cust.message}</p>
                </div>
              )}
            </div>
            
            {cust.photos && cust.photos.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {cust.photos.map((photo, i) => (
                  <div key={i} className="relative group shrink-0">
                    <img 
                      src={photo} 
                      alt="Customization" 
                      className="w-16 h-16 object-cover rounded border border-gray-200"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded gap-2">
                      <a 
                        href={photo} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-1 hover:bg-white/20 rounded transition-colors"
                        title="View Full Size"
                      >
                        <ImageIcon className="h-4 w-4 text-white" />
                      </a>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleDownload(photo, `order-${cust.orderNumber}-custom-${i}.jpg`);
                        }}
                        className="p-1 hover:bg-white/20 rounded transition-colors"
                        title="Download Image"
                      >
                        <Download className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <p className="text-[10px] text-gray-400 mt-2 text-right">
              {new Date(cust.date).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
      
      <Button 
        variant="link" 
        className="w-full mt-4 text-primary"
        onClick={() => navigate('/admin/orders')}
      >
        View All Orders
      </Button>
    </Card>
  );
};

export default RecentCustomizations;
