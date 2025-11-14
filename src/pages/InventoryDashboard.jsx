import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  TrendingUp,
  LayoutDashboard, 
  Package, 
  Users, 
  LogOut,
  Menu,
  X,
  ListOrdered
} from 'lucide-react';

export default function InventoryDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);

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
    { icon: Package, label: "Products", action: () => navigate("/admin") }, // Navigate to main admin which has products view
    { icon: ListOrdered, label: "Orders", path: "/admin/orders" },
    { icon: Users, label: "Customers", path: "/admin/customers" },
  ];

  const handleLogout = () => {
    // Clear admin token from localStorage
    localStorage.removeItem("adminToken");
    // Navigate to admin login page
    navigate("/admin/login");
  };

  // Fetch all inventory items
  useEffect(() => {
    const fetchInventory = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/admin/inventory');
        const data = await response.json();
        setInventory(data);
        setFilteredInventory(data);
        
        // Filter low stock items (quantity <= 10)
        const lowStock = data.filter(item => item.quantity <= 10);
        setLowStockItems(lowStock);
      } catch (error) {
        console.error('Error fetching inventory:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  // Filter inventory based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredInventory(inventory);
    } else {
      const filtered = inventory.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredInventory(filtered);
    }
  }, [searchQuery, inventory]);

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      try {
        const response = await fetch(`/api/admin/inventory/${itemId}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          setInventory(inventory.filter(item => item.id !== itemId));
        }
      } catch (error) {
        console.error('Error deleting inventory item:', error);
      }
    }
  };

  const getStockStatus = (quantity) => {
    if (quantity <= 5) {
      return <Badge variant="destructive">Low Stock</Badge>;
    } else if (quantity <= 10) {
      return <Badge variant="secondary">Running Low</Badge>;
    } else {
      return <Badge className="bg-green-500">In Stock</Badge>;
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
              const isActive = item.path ? location.pathname === item.path : false;
              return (
                <li key={index}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      if (item.action) {
                        item.action();
                      } else {
                        navigate(item.path);
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
            <h1 className="text-xl font-semibold">Inventory Management</h1>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Inventory Management</h1>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>

          {/* Low Stock Alert */}
          {lowStockItems.length > 0 && (
            <Card className="p-4 mb-6 bg-yellow-50 border-yellow-200">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                <div>
                  <h3 className="font-medium text-yellow-800">Low Stock Alert</h3>
                  <p className="text-yellow-700">
                    {lowStockItems.length} item{lowStockItems.length !== 1 ? 's' : ''} running low
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Inventory Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Total Items</p>
                  <p className="text-2xl font-bold">{inventory.length}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">In Stock</p>
                  <p className="text-2xl font-bold">
                    {inventory.filter(item => item.quantity > 10).length}
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Low Stock</p>
                  <p className="text-2xl font-bold">{lowStockItems.length}</p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6 mb-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search inventory by name, SKU, or category..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </Card>

          {loading ? (
            <div className="text-center py-8">Loading inventory...</div>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">Product</th>
                      <th className="text-left p-4">SKU</th>
                      <th className="text-left p-4">Category</th>
                      <th className="text-left p-4">Price</th>
                      <th className="text-left p-4">Quantity</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-left p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div className="font-medium">{item.name || 'N/A'}</div>
                        </td>
                        <td className="p-4">{item.sku || 'N/A'}</td>
                        <td className="p-4">
                          <Badge variant="outline">{item.category || 'N/A'}</Badge>
                        </td>
                        <td className="p-4">₹{item.price?.toFixed(2) || '0.00'}</td>
                        <td className="p-4">{item.quantity || 0}</td>
                        <td className="p-4">
                          {getStockStatus(item.quantity)}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDeleteItem(item.id)}
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
              
              {filteredInventory.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No inventory items found
                </div>
              )}
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}