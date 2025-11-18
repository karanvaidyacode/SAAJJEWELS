const { pineconeIndex } = require('../utils/pinecone');

// Convert payment data to vector representation
const paymentToVector = (payment) => {
  // This is a simplified example - in a real application, you would use an embedding model
  // to convert payment details into vectors
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
  
  // Create a simple vector representation based on payment properties
  const text = `${payment.method || ''} ${payment.status || ''} ${payment.customerEmail || ''} ${payment.amount || ''}`.toLowerCase();
  for (let i = 0; i < Math.min(10, text.length); i++) {
    const index = hash(text.substring(i, i + 5)) % 1536;
    vector[index] = (vector[index] || 0) + 1;
  }
  
  return vector;
};

// In-memory payment storage (in production, you might want to use a database)
let payments = {};
let nextPaymentId = 1;

// Get all payments
exports.getAllPayments = async (req, res) => {
  try {
    const paymentList = Object.values(payments);
    res.json(paymentList);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get payment by ID
exports.getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = payments[id];
    
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }
    
    res.json(payment);
  } catch (error) {
    console.error("Error fetching payment:", error);
    res.status(500).json({ error: error.message });
  }
};

// Create new payment
exports.createPayment = async (req, res) => {
  try {
    const paymentData = req.body;
    const paymentId = `payment_${nextPaymentId++}`;
    
    const payment = {
      id: paymentId,
      ...paymentData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    payments[paymentId] = payment;
    
    // Also save to Pinecone
    try {
      const vector = paymentToVector(payment);
      const metadata = {
        ...payment,
        paymentId: paymentId,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt
      };
      
      await pineconeIndex.upsert([{
        id: paymentId,
        values: vector,
        metadata: metadata
      }]);
    } catch (pineconeError) {
      console.error('Error saving payment to Pinecone:', pineconeError);
      // Don't fail the request if Pinecone fails, just log the error
    }
    
    res.status(201).json(payment);
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({ error: error.message });
  }
};

// Update payment
exports.updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const paymentData = req.body;
    
    if (!payments[id]) {
      return res.status(404).json({ error: "Payment not found" });
    }
    
    const updatedPayment = {
      ...payments[id],
      ...paymentData,
      id: id,
      updatedAt: new Date().toISOString()
    };
    
    payments[id] = updatedPayment;
    
    // Also update in Pinecone
    try {
      const vector = paymentToVector(updatedPayment);
      const metadata = {
        ...updatedPayment,
        paymentId: id,
        updatedAt: updatedPayment.updatedAt
      };
      
      await pineconeIndex.upsert([{
        id: id,
        values: vector,
        metadata: metadata
      }]);
    } catch (pineconeError) {
      console.error('Error updating payment in Pinecone:', pineconeError);
      // Don't fail the request if Pinecone fails, just log the error
    }
    
    res.json(updatedPayment);
  } catch (error) {
    console.error("Error updating payment:", error);
    res.status(500).json({ error: error.message });
  }
};

// Delete payment
exports.deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!payments[id]) {
      return res.status(404).json({ error: "Payment not found" });
    }
    
    delete payments[id];
    
    // Also delete from Pinecone
    try {
      await pineconeIndex.deleteOne(id);
    } catch (pineconeError) {
      console.error('Error deleting payment from Pinecone:', pineconeError);
      // Don't fail the request if Pinecone fails, just log the error
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting payment:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get payments by status
exports.getPaymentsByStatus = async (req, res) => {
  try {
    const { status } = req.query;
    
    if (!status) {
      return res.status(400).json({ error: "Status parameter is required" });
    }
    
    const matchingPayments = Object.values(payments).filter(payment => 
      payment.status.toLowerCase() === status.toLowerCase()
    );
    
    res.json(matchingPayments);
  } catch (error) {
    console.error("Error fetching payments by status:", error);
    res.status(500).json({ error: error.message });
  }
};

// Search similar payments using vector similarity
exports.searchSimilarPayments = async (req, res) => {
  try {
    const { query, topK = 10 } = req.body;
    
    // Convert query to vector
    const queryVector = paymentToVector({ 
      method: query, 
      status: query, 
      customerEmail: query,
      amount: query
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
    console.error("Error searching similar payments:", error);
    res.status(500).json({ error: error.message });
  }
};