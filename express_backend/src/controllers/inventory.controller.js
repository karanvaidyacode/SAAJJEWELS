const { pineconeIndex } = require('../utils/pinecone');

// Convert inventory data to vector representation
const inventoryToVector = (item) => {
  // This is a simplified example - in a real application, you would use an embedding model
  // to convert inventory details into vectors
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
  
  // Create a simple vector representation based on inventory properties
  const text = `${item.name || ''} ${item.category || ''} ${item.description || ''} ${item.sku || ''}`.toLowerCase();
  for (let i = 0; i < Math.min(10, text.length); i++) {
    const index = hash(text.substring(i, i + 5)) % 1536;
    vector[index] = (vector[index] || 0) + 1;
  }
  
  return vector;
};

// In-memory inventory storage (in production, you might want to use a database)
let inventory = {};
let nextItemId = 1;

// Get all inventory items
exports.getAllInventory = async (req, res) => {
  try {
    const itemList = Object.values(inventory);
    res.json(itemList);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get inventory item by ID
exports.getInventoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = inventory[id];
    
    if (!item) {
      return res.status(404).json({ error: "Inventory item not found" });
    }
    
    res.json(item);
  } catch (error) {
    console.error("Error fetching inventory item:", error);
    res.status(500).json({ error: error.message });
  }
};

// Create new inventory item
exports.createInventoryItem = async (req, res) => {
  try {
    const itemData = req.body;
    const itemId = `item_${nextItemId++}`;
    
    const item = {
      id: itemId,
      ...itemData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    inventory[itemId] = item;
    
    // Also save to Pinecone
    try {
      const vector = inventoryToVector(item);
      const metadata = {
        ...item,
        itemId: itemId,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      };
      
      await pineconeIndex.upsert([{
        id: itemId,
        values: vector,
        metadata: metadata
      }]);
    } catch (pineconeError) {
      console.error('Error saving inventory item to Pinecone:', pineconeError);
      // Don't fail the request if Pinecone fails, just log the error
    }
    
    res.status(201).json(item);
  } catch (error) {
    console.error("Error creating inventory item:", error);
    res.status(500).json({ error: error.message });
  }
};

// Update inventory item
exports.updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const itemData = req.body;
    
    if (!inventory[id]) {
      return res.status(404).json({ error: "Inventory item not found" });
    }
    
    const updatedItem = {
      ...inventory[id],
      ...itemData,
      id: id,
      updatedAt: new Date().toISOString()
    };
    
    inventory[id] = updatedItem;
    
    // Also update in Pinecone
    try {
      const vector = inventoryToVector(updatedItem);
      const metadata = {
        ...updatedItem,
        itemId: id,
        updatedAt: updatedItem.updatedAt
      };
      
      await pineconeIndex.upsert([{
        id: id,
        values: vector,
        metadata: metadata
      }]);
    } catch (pineconeError) {
      console.error('Error updating inventory item in Pinecone:', pineconeError);
      // Don't fail the request if Pinecone fails, just log the error
    }
    
    res.json(updatedItem);
  } catch (error) {
    console.error("Error updating inventory item:", error);
    res.status(500).json({ error: error.message });
  }
};

// Delete inventory item
exports.deleteInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!inventory[id]) {
      return res.status(404).json({ error: "Inventory item not found" });
    }
    
    delete inventory[id];
    
    // Also delete from Pinecone
    try {
      await pineconeIndex.deleteOne(id);
    } catch (pineconeError) {
      console.error('Error deleting inventory item from Pinecone:', pineconeError);
      // Don't fail the request if Pinecone fails, just log the error
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get inventory overview
exports.getInventoryOverview = async (req, res) => {
  try {
    // In a real implementation, you would fetch this data from MongoDB
    const mockInventory = {
      totalProducts: 150,
      inStock: 120,
      lowStock: 25,
      outOfStock: 5,
      categories: [
        { name: "Rings", count: 45, inStock: 40, lowStock: 3, outOfStock: 2 },
        { name: "Necklaces", count: 35, inStock: 30, lowStock: 3, outOfStock: 2 },
        { name: "Earrings", count: 40, inStock: 30, lowStock: 8, outOfStock: 2 },
        { name: "Bracelets", count: 30, inStock: 20, lowStock: 7, outOfStock: 3 }
      ]
    };
    
    res.json(mockInventory);
  } catch (error) {
    console.error('Error fetching inventory overview:', error);
    res.status(500).json({ message: 'Error fetching inventory overview', error: error.message });
  }
};

// Get low stock items
exports.getLowStockItems = async (req, res) => {
  try {
    // In a real implementation, you would fetch this data from MongoDB
    const mockLowStockItems = [
      { id: "1", name: "Diamond Ring", sku: "DR-001", stock: 2, minStock: 5 },
      { id: "2", name: "Gold Necklace", sku: "GN-002", stock: 1, minStock: 3 },
      { id: "3", name: "Silver Earrings", sku: "SE-003", stock: 3, minStock: 5 }
    ];
    
    res.json(mockLowStockItems);
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ message: 'Error fetching low stock items', error: error.message });
  }
};

// Update stock level
exports.updateStockLevel = async (req, res) => {
  try {
    const { productId, newStockLevel } = req.body;
    
    // In a real implementation, you would update this in MongoDB
    res.json({
      success: true,
      message: `Stock level updated for product ${productId}`,
      productId,
      newStockLevel
    });
  } catch (error) {
    console.error('Error updating stock level:', error);
    res.status(500).json({ message: 'Error updating stock level', error: error.message });
  }
};

// Search similar inventory items using vector similarity
exports.searchSimilarItems = async (req, res) => {
  try {
    const { query, topK = 10 } = req.body;
    
    // Convert query to vector
    const queryVector = inventoryToVector({ 
      name: query, 
      category: query, 
      description: query
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
    console.error("Error searching similar items:", error);
    res.status(500).json({ error: error.message });
  }
};