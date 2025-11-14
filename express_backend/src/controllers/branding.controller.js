const { pineconeIndex } = require('../utils/pinecone');

// Convert branding data to vector representation
const brandingToVector = (branding) => {
  // This is a simplified example - in a real application, you would use an embedding model
  // to convert branding details into vectors
  const vector = new Array(1536).fill(0);
  
  // Simple hash-based approach for demonstration
  const hash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  };
  
  // Create a simple vector representation based on branding properties
  const text = `${branding.name || ''} ${branding.tagline || ''} ${branding.description || ''} ${branding.industry || ''}`.toLowerCase();
  for (let i = 0; i < Math.min(10, text.length); i++) {
    const index = hash(text.substring(i, i + 5)) % 1536;
    vector[index] = (vector[index] || 0) + 1;
  }
  
  return vector;
};

// Remove Pinecone references and replace with PostgreSQL-based logic
const { User } = require('../models/postgres');

// Mock branding settings since we're removing Pinecone
let brandingSettings = {
  siteName: "Saaj Jewels",
  logoUrl: "/logo.png",
  primaryColor: "#c6a856",
  secondaryColor: "#f5f5f5",
  fontFamily: "Arial, sans-serif",
  faviconUrl: "/favicon.ico",
  contactEmail: "info@saajjewels.com",
  contactPhone: "+1234567890",
  socialLinks: {
    facebook: "https://facebook.com/saajjewels",
    instagram: "https://instagram.com/saajjewels",
    twitter: "https://twitter.com/saajjewels"
  }
};

// Get branding settings
exports.getBrandingSettings = async (req, res) => {
  try {
    res.json(brandingSettings);
  } catch (error) {
    console.error('Error fetching branding settings:', error);
    res.status(500).json({ message: 'Error fetching branding settings', error: error.message });
  }
};

// Update branding settings
exports.updateBrandingSettings = async (req, res) => {
  try {
    const updatedSettings = { ...brandingSettings, ...req.body };
    brandingSettings = updatedSettings;
    
    res.json({
      success: true,
      message: 'Branding settings updated successfully',
      settings: brandingSettings
    });
  } catch (error) {
    console.error('Error updating branding settings:', error);
    res.status(500).json({ message: 'Error updating branding settings', error: error.message });
  }
};

// Reset branding settings to defaults
exports.resetBrandingSettings = async (req, res) => {
  try {
    brandingSettings = {
      siteName: "Saaj Jewels",
      logoUrl: "/logo.png",
      primaryColor: "#c6a856",
      secondaryColor: "#f5f5f5",
      fontFamily: "Arial, sans-serif",
      faviconUrl: "/favicon.ico",
      contactEmail: "info@saajjewels.com",
      contactPhone: "+1234567890",
      socialLinks: {
        facebook: "https://facebook.com/saajjewels",
        instagram: "https://instagram.com/saajjewels",
        twitter: "https://twitter.com/saajjewels"
      }
    };
    
    res.json({
      success: true,
      message: 'Branding settings reset to defaults',
      settings: brandingSettings
    });
  } catch (error) {
    console.error('Error resetting branding settings:', error);
    res.status(500).json({ message: 'Error resetting branding settings', error: error.message });
  }
};

// Search similar branding configurations using vector similarity
exports.searchSimilarBranding = async (req, res) => {
  try {
    const { query, topK = 10 } = req.body;
    
    // Convert query to vector
    const queryVector = brandingToVector({ 
      name: query, 
      tagline: query, 
      description: query,
      industry: query
    });
    
    // Query Pinecone
    const queryRequest = {
      vector: queryVector,
      topK: parseInt(topK),
      includeMetadata: true
    };
    
    const response = await pineconeIndex.query(queryRequest);
    
    res.json(response.matches);
  } catch (error) {
    console.error("Error searching similar branding:", error);
    res.status(500).json({ error: error.message });
  }
};