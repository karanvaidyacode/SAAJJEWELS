const { User } = require("../models/postgres");

// --- Cart endpoints ---
exports.getCart = async (req, res) => {
  try {
    const email = req.header('x-user-email');
    if (!email) return res.status(401).json({ message: 'Not authenticated' });
    
    // Try to find user, create if not exists
    let user = await User.findOne({ where: { email } });
    if (!user) {
      // Create a new user with empty cart
      user = await User.create({ 
        email, 
        password: await User.hashPassword(Math.random().toString(36).slice(-8)), // Random password
        cart: [] 
      });
    }
    
    return res.json(user.cart || []);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching cart', error: error.message });
  }
}

exports.updateCart = async (req, res) => {
  try {
    const email = req.header('x-user-email');
    if (!email) return res.status(401).json({ message: 'Not authenticated' });
    
    // Try to find user, create if not exists
    let user = await User.findOne({ email });
    if (!user) {
      // Create a new user with the cart data
      user = await User.create({ 
        email, 
        password: await User.hashPassword(Math.random().toString(36).slice(-8)), // Random password
        cart: req.body || [] 
      });
    } else {
      // Update existing user's cart
      await User.update(
        { cart: req.body || [] },
        { where: { email } }
      );
      user = await User.findOne({ where: { email } });
    }
    
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating cart', error: error.message });
  }
}

exports.clearCart = async (req, res) => {
  try {
    const email = req.header('x-user-email');
    if (!email) return res.status(401).json({ message: 'Not authenticated' });
    
    // Try to find user, create if not exists
    let user = await User.findOne({ where: { email } });
    if (!user) {
      // Create a new user with empty cart
      user = await User.create({ 
        email, 
        password: await User.hashPassword(Math.random().toString(36).slice(-8)), // Random password
        cart: [] 
      });
    } else {
      // Clear existing user's cart
      await User.update(
        { cart: [] },
        { where: { email } }
      );
      user = await User.findOne({ where: { email } });
    }
    
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: 'Error clearing cart', error: error.message });
  }
}

// --- Address endpoints ---
exports.getAddresses = async (req, res) => {
  try {
    const email = req.header('x-user-email');
    if (!email) return res.status(401).json({ message: 'Not authenticated' });
    
    // Try to find user, create if not exists
    let user = await User.findOne({ where: { email } });
    if (!user) {
      // Create a new user with empty addresses
      user = await User.create({ 
        email, 
        password: await User.hashPassword(Math.random().toString(36).slice(-8)), // Random password
        addresses: [] 
      });
    }
    
    return res.json(user.addresses || []);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching addresses', error: error.message });
  }
}

exports.addAddress = async (req, res) => {
  try {
    const email = req.header('x-user-email');
    if (!email) return res.status(401).json({ message: 'Not authenticated' });
    
    const addr = { ...req.body, id: Date.now().toString() };
    
    // Try to find user, create if not exists
    let user = await User.findOne({ where: { email } });
    if (!user) {
      // Create a new user with the address
      user = await User.create({ 
        email, 
        password: await User.hashPassword(Math.random().toString(36).slice(-8)), // Random password
        addresses: [addr] 
      });
    } else {
      // Add address to existing user
      const updatedAddresses = [...(user.addresses || []), addr];
      await User.update(
        { addresses: updatedAddresses },
        { where: { email } }
      );
      user = await User.findOne({ where: { email } });
    }
    
    return res.json(addr);
  } catch (error) {
    return res.status(500).json({ message: 'Error adding address', error: error.message });
  }
}

exports.updateAddress = async (req, res) => {
  try {
    const email = req.header('x-user-email');
    if (!email) return res.status(401).json({ message: 'Not authenticated' });
    
    const addrId = req.params.id;
    
    // Try to find user, create if not exists
    let user = await User.findOne({ where: { email } });
    if (!user) {
      // Create a new user with empty addresses
      user = await User.create({ 
        email, 
        password: await User.hashPassword(Math.random().toString(36).slice(-8)), // Random password
        addresses: [] 
      });
      return res.status(200).json({ success: true });
    }
    
    const updatedAddresses = user.addresses.map(a => 
      a.id === addrId ? { ...a, ...req.body } : a
    );
    
    await User.update(
      { addresses: updatedAddresses },
      { where: { email } }
    );
    const updatedUser = await User.findOne({ where: { email } });
    
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating address', error: error.message });
  }
}

exports.deleteAddress = async (req, res) => {
  try {
    const email = req.header('x-user-email');
    if (!email) return res.status(401).json({ message: 'Not authenticated' });
    
    const addrId = req.params.id;
    
    // Try to find user, create if not exists
    let user = await User.findOne({ where: { email } });
    if (!user) {
      // Create a new user with empty addresses
      user = await User.create({ 
        email, 
        password: await User.hashPassword(Math.random().toString(36).slice(-8)), // Random password
        addresses: [] 
      });
      return res.status(200).json({ success: true });
    }
    
    const updatedAddresses = user.addresses.filter(a => a.id !== addrId);
    
    await User.update(
      { addresses: updatedAddresses },
      { where: { email } }
    );
    const updatedUser = await User.findOne({ where: { email } });
    
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting address', error: error.message });
  }
}

// --- Order endpoints ---
exports.getOrders = async (req, res) => {
  try {
    const email = req.header('x-user-email');
    if (!email) return res.status(401).json({ message: 'Not authenticated' });
    
    // Try to find user, create if not exists
    let user = await User.findOne({ where: { email } });
    if (!user) {
      // Create a new user with empty orders
      user = await User.create({ 
        email, 
        password: await User.hashPassword(Math.random().toString(36).slice(-8)), // Random password
        orders: [] 
      });
    }
    
    return res.json(user.orders || []);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
}

exports.getOrderById = async (req, res) => {
  try {
    const email = req.header('x-user-email');
    if (!email) return res.status(401).json({ message: 'Not authenticated' });
    
    // Try to find user, create if not exists
    let user = await User.findOne({ where: { email } });
    if (!user) {
      // Create a new user with empty orders
      user = await User.create({ 
        email, 
        password: await User.hashPassword(Math.random().toString(36).slice(-8)), // Random password
        orders: [] 
      });
    }
    
    const order = (user.orders || []).find(o => o.id == req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
}

exports.addOrder = async (req, res) => {
  try {
    const email = req.header('x-user-email');
    if (!email) return res.status(401).json({ message: 'Not authenticated' });
    
    const order = { ...req.body, id: Date.now().toString() };
    
    // Try to find user, create if not exists
    let user = await User.findOne({ where: { email } });
    if (!user) {
      // Create a new user with the order
      user = await User.create({ 
        email, 
        password: await User.hashPassword(Math.random().toString(36).slice(-8)), // Random password
        orders: [order],
        cart: [] // Clear cart after placing order
      });
    } else {
      // Add order to existing user
      const updatedOrders = [...(user.orders || []), order];
      await User.update(
        { 
          orders: updatedOrders,
          cart: [] // Clear cart after placing order
        },
        { where: { email } }
      );
      user = await User.findOne({ where: { email } });
    }
    
    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: 'Error adding order', error: error.message });
  }
}