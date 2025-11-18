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
  Play, 
  Pause, 
  Tag, 
  Gift,
  Percent,
  Target
} from 'lucide-react';

export default function MarketingTools() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    type: 'discount',
    discountPercentage: 10,
    targetAudience: 'all',
    startDate: '',
    endDate: ''
  });

  // Fetch all campaigns
  useEffect(() => {
    const fetchCampaigns = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/admin/marketing');
        const data = await response.json();
        setCampaigns(data);
        setFilteredCampaigns(data);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  // Filter campaigns based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredCampaigns(campaigns);
    } else {
      const filtered = campaigns.filter(campaign => 
        (campaign.name && campaign.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (campaign.description && campaign.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (campaign.type && campaign.type.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredCampaigns(filtered);
    }
  }, [searchQuery, campaigns]);

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/marketing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCampaign),
      });
      
      if (response.ok) {
        const createdCampaign = await response.json();
        setCampaigns([...campaigns, createdCampaign]);
        setShowCreateForm(false);
        setNewCampaign({
          name: '',
          description: '',
          type: 'discount',
          discountPercentage: 10,
          targetAudience: 'all',
          startDate: '',
          endDate: ''
        });
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  };

  const handleToggleCampaign = async (campaignId) => {
    try {
      const response = await fetch(`/api/admin/marketing/${campaignId}/toggle`, {
        method: 'PUT',
      });
      
      if (response.ok) {
        const updatedCampaign = await response.json();
        setCampaigns(campaigns.map(campaign => 
          campaign.id === campaignId ? updatedCampaign : campaign
        ));
      }
    } catch (error) {
      console.error('Error toggling campaign:', error);
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      try {
        const response = await fetch(`/api/admin/marketing/${campaignId}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          setCampaigns(campaigns.filter(campaign => campaign.id !== campaignId));
        }
      } catch (error) {
        console.error('Error deleting campaign:', error);
      }
    }
  };

  const getCampaignIcon = (type) => {
    switch (type) {
      case 'discount':
        return <Percent className="h-4 w-4" />;
      case 'gift':
        return <Gift className="h-4 w-4" />;
      case 'targeted':
        return <Target className="h-4 w-4" />;
      default:
        return <Tag className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'active') {
      return <Badge className="bg-green-500">Active</Badge>;
    } else {
      return <Badge variant="secondary">Inactive</Badge>;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Marketing Tools</h1>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Campaign
        </Button>
      </div>

      {showCreateForm && (
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Campaign</h2>
          <form onSubmit={handleCreateCampaign} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Campaign Name</label>
              <Input
                value={newCampaign.name}
                onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                placeholder="Summer Sale 2023"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Campaign Type</label>
              <select
                className="w-full p-2 border rounded"
                value={newCampaign.type}
                onChange={(e) => setNewCampaign({...newCampaign, type: e.target.value})}
              >
                <option value="discount">Discount</option>
                <option value="gift">Gift with Purchase</option>
                <option value="targeted">Targeted Offer</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea
                value={newCampaign.description}
                onChange={(e) => setNewCampaign({...newCampaign, description: e.target.value})}
                placeholder="Describe your campaign..."
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Target Audience</label>
              <select
                className="w-full p-2 border rounded"
                value={newCampaign.targetAudience}
                onChange={(e) => setNewCampaign({...newCampaign, targetAudience: e.target.value})}
              >
                <option value="all">All Customers</option>
                <option value="new">New Customers</option>
                <option value="returning">Returning Customers</option>
                <option value="vip">VIP Customers</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Discount Percentage</label>
              <Input
                type="number"
                value={newCampaign.discountPercentage}
                onChange={(e) => setNewCampaign({...newCampaign, discountPercentage: parseInt(e.target.value)})}
                min="0"
                max="100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <Input
                type="date"
                value={newCampaign.startDate}
                onChange={(e) => setNewCampaign({...newCampaign, startDate: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <Input
                type="date"
                value={newCampaign.endDate}
                onChange={(e) => setNewCampaign({...newCampaign, endDate: e.target.value})}
              />
            </div>
            
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Create Campaign
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
              placeholder="Search campaigns by name or type..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="text-center py-8">Loading campaigns...</div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Campaign</th>
                  <th className="text-left p-4">Type</th>
                  <th className="text-left p-4">Audience</th>
                  <th className="text-left p-4">Dates</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div className="font-medium">{campaign.name || 'N/A'}</div>
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {campaign.description || 'No description'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center">
                        {getCampaignIcon(campaign.type)}
                        <span className="ml-2 capitalize">{campaign.type || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">{campaign.targetAudience || 'N/A'}</Badge>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        to {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(campaign.status)}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleToggleCampaign(campaign.id)}
                        >
                          {campaign.status === 'active' ? 
                            <Pause className="h-4 w-4" /> : 
                            <Play className="h-4 w-4" />
                          }
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeleteCampaign(campaign.id)}
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
          
          {filteredCampaigns.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No campaigns found
            </div>
          )}
        </Card>
      )}
    </div>
  );
}