import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Save, 
  RotateCcw, 
  Palette, 
  Image, 
  Link,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

export default function BrandingSettings() {
  const [branding, setBranding] = useState({
    name: '',
    tagline: '',
    description: '',
    logo: '',
    favicon: '',
    primaryColor: '#8B5CF6',
    secondaryColor: '#F59E0B',
    accentColor: '#EC4899',
    industry: '',
    website: '',
    email: '',
    phone: '',
    address: '',
    socialMedia: {
      facebook: '',
      instagram: '',
      twitter: ''
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch current branding settings
  useEffect(() => {
    const fetchBranding = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/admin/branding');
        const data = await response.json();
        setBranding(data);
      } catch (error) {
        console.error('Error fetching branding settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBranding();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/admin/branding', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(branding),
      });
      
      if (response.ok) {
        // Settings saved successfully
        alert('Branding settings saved successfully!');
      }
    } catch (error) {
      console.error('Error saving branding settings:', error);
      alert('Error saving branding settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset to default settings?')) {
      try {
        const response = await fetch('/api/admin/branding/reset', {
          method: 'POST',
        });
        
        if (response.ok) {
          const defaultSettings = await response.json();
          setBranding(defaultSettings);
          alert('Branding settings reset to default!');
        }
      } catch (error) {
        console.error('Error resetting branding settings:', error);
        alert('Error resetting branding settings');
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Store Branding</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset to Default
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading branding settings...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Brand Identity */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Palette className="mr-2 h-5 w-5" />
                Brand Identity
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Store Name</label>
                  <Input
                    value={branding.name}
                    onChange={(e) => setBranding({...branding, name: e.target.value})}
                    placeholder="Your Store Name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Tagline</label>
                  <Input
                    value={branding.tagline}
                    onChange={(e) => setBranding({...branding, tagline: e.target.value})}
                    placeholder="Your store tagline"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Textarea
                    value={branding.description}
                    onChange={(e) => setBranding({...branding, description: e.target.value})}
                    placeholder="Describe your store..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Industry</label>
                  <Input
                    value={branding.industry}
                    onChange={(e) => setBranding({...branding, industry: e.target.value})}
                    placeholder="e.g., Jewelry, Fashion"
                  />
                </div>
              </div>
            </Card>
            
            {/* Visual Elements */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Image className="mr-2 h-5 w-5" />
                Visual Elements
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Logo URL</label>
                  <Input
                    value={branding.logo}
                    onChange={(e) => setBranding({...branding, logo: e.target.value})}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Favicon URL</label>
                  <Input
                    value={branding.favicon}
                    onChange={(e) => setBranding({...branding, favicon: e.target.value})}
                    placeholder="https://example.com/favicon.ico"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Primary Color</label>
                  <div className="flex items-center">
                    <Input
                      type="color"
                      value={branding.primaryColor}
                      onChange={(e) => setBranding({...branding, primaryColor: e.target.value})}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={branding.primaryColor}
                      onChange={(e) => setBranding({...branding, primaryColor: e.target.value})}
                      className="ml-2 flex-1"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Secondary Color</label>
                  <div className="flex items-center">
                    <Input
                      type="color"
                      value={branding.secondaryColor}
                      onChange={(e) => setBranding({...branding, secondaryColor: e.target.value})}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={branding.secondaryColor}
                      onChange={(e) => setBranding({...branding, secondaryColor: e.target.value})}
                      className="ml-2 flex-1"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Accent Color</label>
                  <div className="flex items-center">
                    <Input
                      type="color"
                      value={branding.accentColor}
                      onChange={(e) => setBranding({...branding, accentColor: e.target.value})}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={branding.accentColor}
                      onChange={(e) => setBranding({...branding, accentColor: e.target.value})}
                      className="ml-2 flex-1"
                    />
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Contact Information */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Mail className="mr-2 h-5 w-5" />
                Contact Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Website</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                      <Link className="h-4 w-4" />
                    </span>
                    <Input
                      value={branding.website}
                      onChange={(e) => setBranding({...branding, website: e.target.value})}
                      placeholder="https://example.com"
                      className="rounded-l-none"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                      <Mail className="h-4 w-4" />
                    </span>
                    <Input
                      value={branding.email}
                      onChange={(e) => setBranding({...branding, email: e.target.value})}
                      placeholder="contact@example.com"
                      className="rounded-l-none"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                      <Phone className="h-4 w-4" />
                    </span>
                    <Input
                      value={branding.phone}
                      onChange={(e) => setBranding({...branding, phone: e.target.value})}
                      placeholder="+1234567890"
                      className="rounded-l-none"
                    />
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <Textarea
                      value={branding.address}
                      onChange={(e) => setBranding({...branding, address: e.target.value})}
                      placeholder="123 Main Street, City, Country"
                      rows={2}
                      className="rounded-l-none"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Preview */}
          <div>
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Preview</h2>
              <div className="border rounded-lg p-4">
                <div className="text-center mb-4">
                  {branding.logo ? (
                    <img src={branding.logo} alt="Logo" className="mx-auto h-16" />
                  ) : (
                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto" />
                  )}
                  <h3 className="text-xl font-bold mt-2" style={{color: branding.primaryColor}}>
                    {branding.name || 'Store Name'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {branding.tagline || 'Store Tagline'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-2" />
                    {branding.email || 'contact@example.com'}
                  </div>
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 mr-2" />
                    {branding.phone || '+1234567890'}
                  </div>
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="truncate">{branding.address || '123 Main Street, City'}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm">{branding.description || 'Store description...'}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}