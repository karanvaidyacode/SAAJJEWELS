// Remove Pinecone references and replace with PostgreSQL-based logic
const { User } = require('../models/postgres');

// Mock shipping data since we're removing Pinecone
let shipments = [
  {
    id: "1",
    orderId: "1",
    carrier: "FedEx",
    trackingNumber: "1234567890",
    status: "shipped",
    estimatedDelivery: new Date("2025-10-20T00:00:00Z"),
    shippedAt: new Date("2025-10-15T10:30:00Z"),
    deliveredAt: null
  },
  {
    id: "2",
    orderId: "2",
    carrier: "UPS",
    trackingNumber: "0987654321",
    status: "processing",
    estimatedDelivery: new Date("2025-10-22T00:00:00Z"),
    shippedAt: null,
    deliveredAt: null
  }
];

// Get all shipments
exports.getShipments = async (req, res) => {
  try {
    res.json(shipments);
  } catch (error) {
    console.error('Error fetching shipments:', error);
    res.status(500).json({ message: 'Error fetching shipments', error: error.message });
  }
};

// Get a shipment by ID
exports.getShipmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const shipment = shipments.find(shipment => shipment.id === id);
    
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }
    
    res.json(shipment);
  } catch (error) {
    console.error('Error fetching shipment:', error);
    res.status(500).json({ message: 'Error fetching shipment', error: error.message });
  }
};

// Create a new shipment
exports.createShipment = async (req, res) => {
  try {
    const newShipment = {
      id: Date.now().toString(),
      ...req.body,
      status: "processing",
      shippedAt: null,
      deliveredAt: null
    };
    
    shipments.push(newShipment);
    
    res.status(201).json({
      success: true,
      message: 'Shipment created successfully',
      shipment: newShipment
    });
  } catch (error) {
    console.error('Error creating shipment:', error);
    res.status(500).json({ message: 'Error creating shipment', error: error.message });
  }
};

// Update a shipment
exports.updateShipment = async (req, res) => {
  try {
    const { id } = req.params;
    const index = shipments.findIndex(shipment => shipment.id === id);
    
    if (index === -1) {
      return res.status(404).json({ message: 'Shipment not found' });
    }
    
    const updatedShipment = {
      ...shipments[index],
      ...req.body
    };
    
    shipments[index] = updatedShipment;
    
    res.json({
      success: true,
      message: 'Shipment updated successfully',
      shipment: updatedShipment
    });
  } catch (error) {
    console.error('Error updating shipment:', error);
    res.status(500).json({ message: 'Error updating shipment', error: error.message });
  }
};

// Delete a shipment
exports.deleteShipment = async (req, res) => {
  try {
    const { id } = req.params;
    const index = shipments.findIndex(shipment => shipment.id === id);
    
    if (index === -1) {
      return res.status(404).json({ message: 'Shipment not found' });
    }
    
    shipments.splice(index, 1);
    
    res.json({
      success: true,
      message: 'Shipment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting shipment:', error);
    res.status(500).json({ message: 'Error deleting shipment', error: error.message });
  }
};

// Update shipment status
exports.updateShipmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const index = shipments.findIndex(shipment => shipment.id === id);
    
    if (index === -1) {
      return res.status(404).json({ message: 'Shipment not found' });
    }
    
    const updatedShipment = { ...shipments[index] };
    
    // Update status and timestamps
    updatedShipment.status = status;
    
    if (status === 'shipped' && !updatedShipment.shippedAt) {
      updatedShipment.shippedAt = new Date().toISOString();
    } else if (status === 'delivered' && !updatedShipment.deliveredAt) {
      updatedShipment.deliveredAt = new Date().toISOString();
    }
    
    shipments[index] = updatedShipment;
    
    res.json({
      success: true,
      message: 'Shipment status updated successfully',
      shipment: updatedShipment
    });
  } catch (error) {
    console.error('Error updating shipment status:', error);
    res.status(500).json({ message: 'Error updating shipment status', error: error.message });
  }
};