const { pineconeIndex } = require('../utils/pinecone');

// Convert product data to vector representation
const productToVector = (product) => {
  // This is a simplified example - in a real application, you would use an embedding model
  // to convert product descriptions, categories, etc. into vectors
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
  
  // Create a simple vector representation based on product properties
  const text = `${product.name} ${product.description} ${product.category}`.toLowerCase();
  for (let i = 0; i < Math.min(10, text.length); i++) {
    const index = hash(text.substring(i, i + 5)) % 1536;
    vector[index] = (vector[index] || 0) + 1;
  }
  
  return vector;
};

// Add product vector to Pinecone
exports.addProductVector = async (req, res) => {
  try {
    // Check if Pinecone is initialized
    if (!pineconeIndex) {
      return res.status(503).json({ error: "Pinecone service not available" });
    }
    
    const { id, ...productData } = req.body;
    
    // Convert product to vector representation
    const vector = productToVector(productData);
    
    // Prepare metadata
    const metadata = {
      ...productData,
      productId: id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Upsert to Pinecone
    await pineconeIndex.upsert([{
      id: `product_${id}`,
      values: vector,
      metadata: metadata
    }]);
    
    res.json({ success: true, message: "Product vector added successfully" });
  } catch(err) {
    console.error("Error adding product vector:", err);
    res.status(500).json({ error: err.message });
  }
};

// Update product vector in Pinecone
exports.updateProductVector = async (req, res) => {
  try {
    // Check if Pinecone is initialized
    if (!pineconeIndex) {
      return res.status(503).json({ error: "Pinecone service not available" });
    }
    
    const { id, ...productData } = req.body;
    
    // Convert product to vector representation
    const vector = productToVector(productData);
    
    // Prepare metadata
    const metadata = {
      ...productData,
      productId: id,
      updatedAt: new Date().toISOString()
    };
    
    // Upsert to Pinecone (update)
    await pineconeIndex.upsert([{
      id: `product_${id}`,
      values: vector,
      metadata: metadata
    }]);
    
    res.json({ success: true, message: "Product vector updated successfully" });
  } catch(err) {
    console.error("Error updating product vector:", err);
    res.status(500).json({ error: err.message });
  }
};

// Delete product vector from Pinecone
exports.deleteProductVector = async (req, res) => {
  try {
    // Check if Pinecone is initialized
    if (!pineconeIndex) {
      return res.status(503).json({ error: "Pinecone service not available" });
    }
    
    const { id } = req.params;
    
    // Delete from Pinecone
    await pineconeIndex.deleteOne(`product_${id}`);
    
    res.json({ success: true, message: "Product vector deleted successfully" });
  } catch(err) {
    console.error("Error deleting product vector:", err);
    res.status(500).json({ error: err.message });
  }
};

// Search similar products using vector similarity
exports.searchSimilarProducts = async (req, res) => {
  try {
    // Check if Pinecone is initialized
    if (!pineconeIndex) {
      return res.status(503).json({ error: "Pinecone service not available" });
    }
    
    const { query, topK = 10 } = req.body;
    
    // Convert query to vector
    const queryVector = productToVector({ name: query, description: query, category: query });
    
    // Query Pinecone
    const queryRequest = {
      vector: queryVector,
      topK: parseInt(topK),
      includeMetadata: true
    };
    
    const response = await pineconeIndex.query(queryRequest);
    
    res.json(response.matches);
  } catch(err) {
    console.error("Error searching similar products:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get product by ID from Pinecone
exports.getProductVector = async (req, res) => {
  try {
    // Check if Pinecone is initialized
    if (!pineconeIndex) {
      return res.status(503).json({ error: "Pinecone service not available" });
    }
    
    const { id } = req.params;
    
    // Fetch from Pinecone
    const response = await pineconeIndex.fetch([`product_${id}`]);
    
    if (response && response.records && response.records[`product_${id}`]) {
      res.json(response.records[`product_${id}`]);
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  } catch(err) {
    console.error("Error fetching product vector:", err);
    res.status(500).json({ error: err.message });
  }
};