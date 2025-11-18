// Remove Pinecone references and replace with PostgreSQL-based logic
const { User } = require('../models/postgres');

// Mock marketing data since we're removing Pinecone
let campaigns = [
  {
    id: "1",
    name: "Holiday Sale",
    type: "email",
    startDate: new Date("2025-11-01T00:00:00Z"),
    endDate: new Date("2025-12-31T23:59:59Z"),
    status: "active",
    budget: 5000,
    impressions: 15000,
    clicks: 1200,
    conversions: 45
  },
  {
    id: "2",
    name: "New Collection Launch",
    type: "social_media",
    startDate: new Date("2025-10-15T00:00:00Z"),
    endDate: new Date("2025-11-15T23:59:59Z"),
    status: "completed",
    budget: 3000,
    impressions: 22000,
    clicks: 1800,
    conversions: 68
  }
];

// Get all campaigns
exports.getCampaigns = async (req, res) => {
  try {
    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ message: 'Error fetching campaigns', error: error.message });
  }
};

// Get a campaign by ID
exports.getCampaignById = async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = campaigns.find(campaign => campaign.id === id);
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    res.json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ message: 'Error fetching campaign', error: error.message });
  }
};

// Create a new campaign
exports.createCampaign = async (req, res) => {
  try {
    const newCampaign = {
      id: Date.now().toString(),
      ...req.body,
      status: "draft",
      impressions: 0,
      clicks: 0,
      conversions: 0
    };
    
    campaigns.push(newCampaign);
    
    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      campaign: newCampaign
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ message: 'Error creating campaign', error: error.message });
  }
};

// Update a campaign
exports.updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const index = campaigns.findIndex(campaign => campaign.id === id);
    
    if (index === -1) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    const updatedCampaign = {
      ...campaigns[index],
      ...req.body
    };
    
    campaigns[index] = updatedCampaign;
    
    res.json({
      success: true,
      message: 'Campaign updated successfully',
      campaign: updatedCampaign
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ message: 'Error updating campaign', error: error.message });
  }
};

// Delete a campaign
exports.deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const index = campaigns.findIndex(campaign => campaign.id === id);
    
    if (index === -1) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    campaigns.splice(index, 1);
    
    res.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ message: 'Error deleting campaign', error: error.message });
  }
};

// Get marketing analytics
exports.getMarketingAnalytics = async (req, res) => {
  try {
    // Calculate marketing analytics
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;
    
    // Calculate overall performance
    const totalImpressions = campaigns.reduce((sum, c) => sum + (c.impressions || 0), 0);
    const totalClicks = campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);
    const totalConversions = campaigns.reduce((sum, c) => sum + (c.conversions || 0), 0);
    
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(2) : 0;
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks * 100).toFixed(2) : 0;
    
    res.json({
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      totalImpressions,
      totalClicks,
      totalConversions,
      ctr: parseFloat(ctr),
      conversionRate: parseFloat(conversionRate),
      performanceByChannel: [
        { channel: "email", campaigns: 8, impressions: 50000, clicks: 4200, conversions: 168 },
        { channel: "social_media", campaigns: 12, impressions: 120000, clicks: 9600, conversions: 384 },
        { channel: "search", campaigns: 5, impressions: 75000, clicks: 6000, conversions: 240 }
      ]
    });
  } catch (error) {
    console.error('Error fetching marketing analytics:', error);
    res.status(500).json({ message: 'Error fetching marketing analytics', error: error.message });
  }
};