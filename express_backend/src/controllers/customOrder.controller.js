const { pineconeIndex } = require('../utils/pinecone');

// Convert custom order data to vector representation
const customOrderToVector = (order) => {
  // This is a simplified example - in a real application, you would use an embedding model
  // to convert custom order details into vectors
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
  
  // Create a simple vector representation based on custom order properties
  const text = `${order.customerName || ''} ${order.customerEmail || ''} ${order.designDescription || ''} ${order.materials?.join(' ') || ''}`.toLowerCase();
  for (let i = 0; i < Math.min(10, text.length); i++) {
    const index = hash(text.substring(i, i + 5)) % 1536;
    vector[index] = (vector[index] || 0) + 1;
  }
  
  return vector;
};

// In-memory custom order storage (in production, you might want to use a database)
let customOrders = {};
let nextCustomOrderId = 1;

// Get all custom orders
exports.getAllCustomOrders = async (req, res) => {
  try {
    const orderList = Object.values(customOrders);
    res.json(orderList);
  } catch (error) {
    console.error("Error fetching custom orders:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get custom order by ID
exports.getCustomOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = customOrders[id];
    
    if (!order) {
      return res.status(404).json({ error: "Custom order not found" });
    }
    
    res.json(order);
  } catch (error) {
    console.error("Error fetching custom order:", error);
    res.status(500).json({ error: error.message });
  }
};

// Create new custom order
exports.createCustomOrder = async (req, res) => {
  try {
    const orderData = req.body;
    const orderId = `custom_${nextCustomOrderId++}`;
    
    const order = {
      id: orderId,
      ...orderData,
      status: 'pending', // Default status
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    customOrders[orderId] = order;
    
    // Also save to Pinecone
    try {
      const vector = customOrderToVector(order);
      const metadata = {
        ...order,
        orderId: orderId,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      };
      
      await pineconeIndex.upsert([{
        id: orderId,
        values: vector,
        metadata: metadata
      }]);
    } catch (pineconeError) {
      console.error('Error saving custom order to Pinecone:', pineconeError);
      // Don't fail the request if Pinecone fails, just log the error
    }
    
    res.status(201).json(order);
  } catch (error) {
    console.error("Error creating custom order:", error);
    res.status(500).json({ error: error.message });
  }
};

// Update custom order
exports.updateCustomOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const orderData = req.body;
    
    if (!customOrders[id]) {
      return res.status(404).json({ error: "Custom order not found" });
    }
    
    const updatedOrder = {
      ...customOrders[id],
      ...orderData,
      id: id,
      updatedAt: new Date().toISOString()
    };
    
    customOrders[id] = updatedOrder;
    
    // Also update in Pinecone
    try {
      const vector = customOrderToVector(updatedOrder);
      const metadata = {
        ...updatedOrder,
        orderId: id,
        updatedAt: updatedOrder.updatedAt
      };
      
      await pineconeIndex.upsert([{
        id: id,
        values: vector,
        metadata: metadata
      }]);
    } catch (pineconeError) {
      console.error('Error updating custom order in Pinecone:', pineconeError);
      // Don't fail the request if Pinecone fails, just log the error
    }
    
    res.json(updatedOrder);
  } catch (error) {
    console.error("Error updating custom order:", error);
    res.status(500).json({ error: error.message });
  }
};

// Delete custom order
exports.deleteCustomOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!customOrders[id]) {
      return res.status(404).json({ error: "Custom order not found" });
    }
    
    delete customOrders[id];
    
    // Also delete from Pinecone
    try {
      await pineconeIndex.deleteOne(id);
    } catch (pineconeError) {
      console.error('Error deleting custom order from Pinecone:', pineconeError);
      // Don't fail the request if Pinecone fails, just log the error
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting custom order:", error);
    res.status(500).json({ error: error.message });
  }
};

// Update custom order status
exports.updateCustomOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!customOrders[id]) {
      return res.status(404).json({ error: "Custom order not found" });
    }
    
    customOrders[id].status = status;
    customOrders[id].updatedAt = new Date().toISOString();
    
    // Also update in Pinecone
    try {
      const vector = customOrderToVector(customOrders[id]);
      const metadata = {
        ...customOrders[id],
        orderId: id,
        updatedAt: customOrders[id].updatedAt
      };
      
      await pineconeIndex.upsert([{
        id: id,
        values: vector,
        metadata: metadata
      }]);
    } catch (pineconeError) {
      console.error('Error updating custom order status in Pinecone:', pineconeError);
      // Don't fail the request if Pinecone fails, just log the error
    }
    
    res.json(customOrders[id]);
  } catch (error) {
    console.error("Error updating custom order status:", error);
    res.status(500).json({ error: error.message });
  }
};

// Search similar custom orders using vector similarity
exports.searchSimilarCustomOrders = async (req, res) => {
  try {
    const { query, topK = 10 } = req.body;
    
    // Convert query to vector
    const queryVector = customOrderToVector({ 
      customerName: query, 
      customerEmail: query, 
      designDescription: query,
      materials: [query]
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
    console.error("Error searching similar custom orders:", error);
    res.status(500).json({ error: error.message });
  }
};