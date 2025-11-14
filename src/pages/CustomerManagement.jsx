import { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  User, 
  Mail, 
  Phone, 
  RefreshCw,
  LayoutDashboard, 
  Package, 
  Users, 
  LogOut,
  Menu,
  X,
  ListOrdered
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useNavigate, useLocation } from "react-router-dom";

export default function CustomerManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const pollingInterval = useRef(null);

  // Fetch all customers
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      // Get admin token from localStorage
      const adminToken = localStorage.getItem("adminToken");
      
      console.log('Fetching customers with admin token:', adminToken);
      const response = await fetchApi("/api/admin/customers", {
        headers: {
          "x-admin-token": adminToken
        }
      });
      
      console.log('Customers response:', response);
      const data = Array.isArray(response) ? response : [];
      console.log('Processed customers data:', data);
      
      // Add id field if it doesn't exist (for compatibility with frontend)
      const processedData = data.map(customer => ({
        ...customer,
        id: customer.id || customer._id  // Use _id if id doesn't exist
      }));
      
      setCustomers(processedData);
      setFilteredCustomers(processedData);
    } catch (error) {
      console.error('Error fetching customers:', error);
      // Convert error to string message
      let errorMessage = 'Failed to fetch customers';
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      } else if (error.toString) {
        errorMessage = error.toString();
      }
      alert(`Error fetching customers: ${errorMessage}`);
      setCustomers([]);
      setFilteredCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
    
    // Set up polling every 30 seconds
    pollingInterval.current = setInterval(fetchCustomers, 30000);
    
    // Clean up interval on component unmount
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [fetchCustomers]);

  // Expose refresh function for external calls
  window.refreshCustomers = fetchCustomers;

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
    { icon: ListOrdered, label: "Orders", path: "/admin/orders" },
    { icon: Users, label: "Customers", path: "/admin/customers" }, // Current page
  ];

  const handleLogout = () => {
    // Clear admin token from localStorage
    localStorage.removeItem("adminToken");
    // Navigate to admin login page
    navigate("/admin/login");
  };

  // Filter customers based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer => 
        (customer.name && customer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (customer.phone && customer.phone.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredCustomers(filtered);
    }
  }, [searchQuery, customers]);

  const handleDeleteCustomer = async (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        // Get admin token from localStorage
        const adminToken = localStorage.getItem("adminToken");
        
        console.log('Deleting customer with ID:', customerId);
        
        // Use the correct ID format (might be _id from MongoDB)
        const actualCustomerId = typeof customerId === 'object' ? customerId._id || customerId.id : customerId;
        console.log('Actual customer ID:', actualCustomerId);
        
        const response = await fetchApi(`/api/admin/customers/${actualCustomerId}`, {
          method: 'DELETE',
          headers: {
            "x-admin-token": adminToken
          }
        });
        
        console.log('Delete customer response:', response);
        
        if (response.success) {
          setCustomers(customers.filter(customer => (customer.id || customer._id) !== actualCustomerId));
          setFilteredCustomers(filteredCustomers.filter(customer => (customer.id || customer._id) !== actualCustomerId));
          // Show success message
          console.log('Customer deleted successfully');
        } else {
          throw new Error(response.message || 'Failed to delete customer');
        }
      } catch (error) {
        console.error('Error deleting customer:', error);
        // Convert error to string message
        let errorMessage = 'Failed to delete customer';
        if (error.message) {
          errorMessage = error.message;
        } else if (typeof error === 'object' && error !== null) {
          errorMessage = JSON.stringify(error);
        } else if (error.toString) {
          errorMessage = error.toString();
        }
        alert(`Error deleting customer: ${errorMessage}`);
      }
    }
  };

  const handleUpdateCustomer = async (customerId, updatedData) => {
    try {
      // Get admin token from localStorage
      const adminToken = localStorage.getItem("adminToken");
      
      const response = await fetchApi(`/api/admin/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          "x-admin-token": adminToken
        },
        body: JSON.stringify(updatedData),
      });
      
      if (response.success) {
        const updatedCustomer = response.customer;
        setCustomers(customers.map(customer => 
          customer.id === customerId ? updatedCustomer : customer
        ));
        setFilteredCustomers(filteredCustomers.map(customer => 
          customer.id === customerId ? updatedCustomer : customer
        ));
      } else {
        throw new Error(response.message || 'Failed to update customer');
      }
    } catch (error) {
      console.error('Error updating customer:', error);
    }
  };

  // Add a simple edit function for now
  const handleEditCustomer = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      const newName = prompt("Enter new name:", customer.name || '');
      const newEmail = prompt("Enter new email:", customer.email || '');
      const newPhone = prompt("Enter new phone:", customer.phone || '');
      
      if (newName !== null && newEmail !== null) {
        // Only update if values have changed
        const updatedData = {};
        if (newName !== (customer.name || '')) updatedData.name = newName;
        if (newEmail !== (customer.email || '')) updatedData.email = newEmail;
        if (newPhone !== (customer.phone || '')) updatedData.phone = newPhone;
        
        if (Object.keys(updatedData).length > 0) {
          handleUpdateCustomer(customerId, updatedData);
        }
      }
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
            <h1 className="text-xl font-semibold">Customer Management</h1>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Customer Management</h1>
              <p className="text-gray-600">Manage and track customers</p>
            </div>
            
          </div>

          <Card className="p-6 mb-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search customers by name, email, or phone..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={fetchCustomers} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </Card>

          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              <p className="mt-2 text-gray-500">Loading customers...</p>
            </div>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">Customer</th>
                      <th className="text-left p-4">Contact</th>
                      <th className="text-left p-4">Orders</th>
                      <th className="text-left p-4">Total Spent</th>
                      <th className="text-left p-4">Last Order</th>
                      <th className="text-left p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center">
                            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center">
                              <User className="h-8 w-8 text-gray-400" />
                            </div>
                            <div className="ml-4">
                              <div className="font-medium">{customer.name || 'N/A'}</div>
                              <div className="text-sm text-gray-500">Customer ID: {(customer.id || '').toString().substring(0, 8)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center text-sm mb-1">
                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                            {customer.email || 'N/A'}
                          </div>
                          <div className="flex items-center text-sm">
                            <Phone className="h-4 w-4 mr-2 text-gray-400" />
                            {customer.phone || 'N/A'}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">{customer.totalOrders || 0} orders</div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">₹{(Number(customer.totalSpent) || 0).toFixed(2)}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-gray-500">
                            {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : 'N/A'}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditCustomer(customer.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDeleteCustomer(customer.id)}
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
              
              {filteredCustomers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No customers found
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}