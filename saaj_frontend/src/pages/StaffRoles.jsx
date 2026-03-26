import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Shield,
  User,
  Key
} from 'lucide-react';

export default function StaffRoles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRoles, setFilteredRoles] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: []
  });
  const [availablePermissions] = useState([
    'read', 'write', 'delete', 'manage_users', 'manage_roles', 
    'view_reports', 'manage_products', 'manage_orders', 'manage_customers',
    'update_orders', 'manage_inventory', 'manage_marketing', 'manage_shipping'
  ]);

  // Fetch all roles
  useEffect(() => {
    const fetchRoles = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/admin/roles');
        const data = await response.json();
        setRoles(data);
        setFilteredRoles(data);
      } catch (error) {
        console.error('Error fetching roles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, []);

  // Filter roles based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredRoles(roles);
    } else {
      const filtered = roles.filter(role => 
        (role.name && role.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (role.description && role.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredRoles(filtered);
    }
  }, [searchQuery, roles]);

  const handleCreateRole = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRole),
      });
      
      if (response.ok) {
        const createdRole = await response.json();
        setRoles([...roles, createdRole]);
        setShowCreateForm(false);
        setNewRole({
          name: '',
          description: '',
          permissions: []
        });
      }
    } catch (error) {
      console.error('Error creating role:', error);
    }
  };

  const handleDeleteRole = async (roleId) => {
    // Prevent deletion of default roles
    if (['admin', 'manager', 'staff'].includes(roleId)) {
      alert('Cannot delete default roles');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        const response = await fetch(`/api/admin/roles/${roleId}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          setRoles(roles.filter(role => role.id !== roleId));
        }
      } catch (error) {
        console.error('Error deleting role:', error);
      }
    }
  };

  const togglePermission = (permission) => {
    if (newRole.permissions.includes(permission)) {
      setNewRole({
        ...newRole,
        permissions: newRole.permissions.filter(p => p !== permission)
      });
    } else {
      setNewRole({
        ...newRole,
        permissions: [...newRole.permissions, permission]
      });
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Staff Roles & Permissions</h1>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Role
        </Button>
      </div>

      {showCreateForm && (
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Role</h2>
          <form onSubmit={handleCreateRole} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Role Name</label>
              <Input
                value={newRole.name}
                onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                placeholder="e.g., Content Manager"
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea
                value={newRole.description}
                onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                placeholder="Describe the role and its responsibilities..."
                rows={3}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Permissions</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {availablePermissions.map((permission) => (
                  <div key={permission} className="flex items-center">
                    <input
                      type="checkbox"
                      id={permission}
                      checked={newRole.permissions.includes(permission)}
                      onChange={() => togglePermission(permission)}
                      className="mr-2"
                    />
                    <label htmlFor={permission} className="text-sm">
                      {permission.replace(/_/g, ' ')}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Create Role
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="p-6 mb-6">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search roles by name or description..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="text-center py-8">Loading roles...</div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Role</th>
                  <th className="text-left p-4">Description</th>
                  <th className="text-left p-4">Permissions</th>
                  <th className="text-left p-4">Users</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.map((role) => (
                  <tr key={role.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-gray-100 rounded-full mr-3">
                          <Shield className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{role.name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">ID: {role.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="max-w-xs truncate">{role.description || 'No description'}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {role.permissions?.slice(0, 3).map((permission, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {permission.replace(/_/g, ' ')}
                          </Badge>
                        )) || 'No permissions'}
                        {role.permissions && role.permissions.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{role.permissions.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">0 users</div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {['admin', 'manager', 'staff'].includes(role.id) ? (
                          <Button variant="outline" size="sm" disabled>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDeleteRole(role.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredRoles.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No roles found
            </div>
          )}
        </Card>
      )}
    </div>
  );
}