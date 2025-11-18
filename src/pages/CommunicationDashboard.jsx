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
  Send, 
  Mail,
  Bell,
  MessageSquare,
  Calendar
} from 'lucide-react';

export default function CommunicationDashboard() {
  const [communications, setCommunications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCommunications, setFilteredCommunications] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCommunication, setNewCommunication] = useState({
    type: 'email',
    subject: '',
    content: '',
    recipient: '',
    scheduledAt: ''
  });

  // Fetch all communications
  useEffect(() => {
    const fetchCommunications = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/admin/communications');
        const data = await response.json();
        setCommunications(data);
        setFilteredCommunications(data);
      } catch (error) {
        console.error('Error fetching communications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunications();
  }, []);

  // Filter communications based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredCommunications(communications);
    } else {
      const filtered = communications.filter(comm => 
        (comm.subject && comm.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (comm.content && comm.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (comm.recipient && comm.recipient.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (comm.type && comm.type.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredCommunications(filtered);
    }
  }, [searchQuery, communications]);

  const handleCreateCommunication = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/communications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCommunication),
      });
      
      if (response.ok) {
        const createdCommunication = await response.json();
        setCommunications([...communications, createdCommunication]);
        setShowCreateForm(false);
        setNewCommunication({
          type: 'email',
          subject: '',
          content: '',
          recipient: '',
          scheduledAt: ''
        });
      }
    } catch (error) {
      console.error('Error creating communication:', error);
    }
  };

  const handleSendCommunication = async (communicationId) => {
    try {
      const response = await fetch(`/api/admin/communications/${communicationId}/send`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const updatedCommunication = await response.json();
        setCommunications(communications.map(comm => 
          comm.id === communicationId ? updatedCommunication : comm
        ));
      }
    } catch (error) {
      console.error('Error sending communication:', error);
    }
  };

  const handleDeleteCommunication = async (communicationId) => {
    if (window.confirm('Are you sure you want to delete this communication?')) {
      try {
        const response = await fetch(`/api/admin/communications/${communicationId}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          setCommunications(communications.filter(comm => comm.id !== communicationId));
        }
      } catch (error) {
        console.error('Error deleting communication:', error);
      }
    }
  };

  const getCommunicationIcon = (type) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'notification':
        return <Bell className="h-4 w-4" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-500">Sent</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-500">Scheduled</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Communication Management</h1>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Communication
        </Button>
      </div>

      {showCreateForm && (
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Communication</h2>
          <form onSubmit={handleCreateCommunication} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                className="w-full p-2 border rounded"
                value={newCommunication.type}
                onChange={(e) => setNewCommunication({...newCommunication, type: e.target.value})}
              >
                <option value="email">Email</option>
                <option value="notification">Push Notification</option>
                <option value="sms">SMS</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Recipient</label>
              <Input
                value={newCommunication.recipient}
                onChange={(e) => setNewCommunication({...newCommunication, recipient: e.target.value})}
                placeholder="customer@example.com"
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Subject</label>
              <Input
                value={newCommunication.subject}
                onChange={(e) => setNewCommunication({...newCommunication, subject: e.target.value})}
                placeholder="Your message subject"
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Content</label>
              <Textarea
                value={newCommunication.content}
                onChange={(e) => setNewCommunication({...newCommunication, content: e.target.value})}
                placeholder="Your message content..."
                rows={4}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Schedule (optional)</label>
              <Input
                type="datetime-local"
                value={newCommunication.scheduledAt}
                onChange={(e) => setNewCommunication({...newCommunication, scheduledAt: e.target.value})}
              />
            </div>
            
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Draft
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
              placeholder="Search communications by subject, content, or recipient..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="text-center py-8">Loading communications...</div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Communication</th>
                  <th className="text-left p-4">Type</th>
                  <th className="text-left p-4">Recipient</th>
                  <th className="text-left p-4">Date</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCommunications.map((comm) => (
                  <tr key={comm.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div className="font-medium">{comm.subject || 'No subject'}</div>
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {comm.content?.substring(0, 50) || 'No content'}...
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center">
                        {getCommunicationIcon(comm.type)}
                        <span className="ml-2 capitalize">{comm.type || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">{comm.recipient || 'N/A'}</div>
                    </td>
                    <td className="p-4">
                      {comm.createdAt ? new Date(comm.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(comm.status)}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {comm.status !== 'sent' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleSendCommunication(comm.id)}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeleteCommunication(comm.id)}
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
          
          {filteredCommunications.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No communications found
            </div>
          )}
        </Card>
      )}
    </div>
  );
}