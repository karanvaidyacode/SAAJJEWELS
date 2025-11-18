const { Order } = require('../models/postgres');
const { Sequelize } = require('sequelize');
const { updateCustomerFromOrder } = require('./customer.controller');
const { sendEmail } = require('../utils/email');

// Get all orders
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({ order: [['createdAt', 'DESC']] });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

// Get an order by ID
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching order with ID:', id);
    
    if (!id) {
      return res.status(400).json({ message: 'Order ID is required' });
    }
    
    const order = await Order.findByPk(id);
    console.log('Found order:', order);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const [updatedRowsCount, updatedOrders] = await Order.update(
      { status, updatedAt: new Date() },
      { where: { id }, returning: true }
    );
    const order = updatedOrders[0];
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Send email notification when order status changes to shipped
    if (status === 'shipped' && order.customerEmail) {
      try {
        await sendEmail({
          to: order.customerEmail,
          subject: `Your SaajJewels Order #${order.orderNumber} Has Been Shipped`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #c6a856;">Order Shipped Notification</h2>
              <p>Hello ${order.customerName || 'Valued Customer'},</p>
              <p>Great news! Your order #${order.orderNumber} has been shipped and is on its way to you.</p>
              <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0;">
                <h3>Order Details:</h3>
                <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                <p><strong>Order Date:</strong> ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Total Amount:</strong> ₹${parseFloat(order.totalAmount || 0).toFixed(2)}</p>
              </div>
              <p>You will receive tracking information via email once your package is out for delivery.</p>
              <p>Thank you for shopping with SaajJewels!</p>
              <p>The SaajJewels Team</p>
            </div>
          `
        });
        console.log(`Shipping notification email sent to ${order.customerEmail}`);
      } catch (emailError) {
        console.error('Failed to send shipping notification email:', emailError);
      }
    }
    
    res.json({
      success: true,
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
};

// Get order analytics
exports.getOrderAnalytics = async (req, res) => {
  try {
    // Calculate order analytics
    const totalOrders = await Order.count();
    
    const totalRevenueResult = await Order.sum('totalAmount');
    const totalRevenue = totalRevenueResult || 0;
    
    // Group orders by status
    const statusCounts = await Order.findAll({
      attributes: ['status', [Sequelize.fn('COUNT', Sequelize.col('status')), 'count']],
      group: ['status'],
      raw: true
    });
    
    const statusMap = {};
    statusCounts.forEach(item => {
      statusMap[item.status] = parseInt(item.count);
    });
    
    // Get sales trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const salesTrend = await Order.findAll({
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('createdAt')), 'date'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'orders'],
        [Sequelize.fn('SUM', Sequelize.col('totalAmount')), 'revenue']
      ],
      where: {
        createdAt: {
          [Sequelize.Op.gte]: thirtyDaysAgo
        }
      },
      group: [Sequelize.fn('DATE', Sequelize.col('createdAt'))],
      order: [[Sequelize.fn('DATE', Sequelize.col('createdAt')), 'ASC']],
      raw: true
    });
    
    res.json({
      totalOrders,
      totalRevenue,
      statusCounts: statusMap,
      salesTrend: salesTrend.map(item => ({
        date: item.date,
        orders: item.orders,
        revenue: item.revenue
      }))
    });
  } catch (error) {
    console.error('Error fetching order analytics:', error);
    res.status(500).json({ message: 'Error fetching order analytics', error: error.message });
  }
};

// Create new order
exports.createOrder = async (req, res) => {
  try {
    const orderData = req.body;
    
    // Generate a unique order number if not provided
    let orderNumber = orderData.orderNumber;
    if (!orderNumber) {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 9000) + 1000;
      orderNumber = `SJ-${timestamp}-${random}`;
    }
    
    // Create the order object with proper structure
    const orderObject = {
      orderNumber: orderNumber,
      customer: orderData.customer || null, // Make customer optional
      customerName: orderData.customerName,
      customerEmail: orderData.customerEmail,
      customerPhone: orderData.customerPhone,
      shippingAddress: orderData.shippingAddress,
      items: orderData.items,
      totalAmount: orderData.totalAmount,
      status: orderData.status || 'pending',
      paymentMethod: orderData.paymentMethod,
      paymentStatus: orderData.paymentStatus || 'pending',
      razorpayOrderId: orderData.razorpayOrderId,
      razorpayPaymentId: orderData.razorpayPaymentId
    };
    
    const savedOrder = await Order.create(orderObject);
    
    // Update customer data with order information
    try {
      if (orderData.customerEmail) {
        await updateCustomerFromOrder({
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
          customerPhone: orderData.customerPhone,
          totalAmount: orderData.totalAmount
        });
      }
    } catch (customerError) {
      console.error('Error updating customer from order:', customerError);
      // Don't fail the order creation if customer update fails
    }
    
    // Send order confirmation email
    console.log('Attempting to send order confirmation email');
    console.log('- Customer email:', savedOrder.customerEmail);
    console.log('- Order number:', savedOrder.orderNumber);
    console.log('- Customer name:', savedOrder.customerName);
    console.log('- Items count:', (savedOrder.items || []).length);
    console.log('- Total amount:', savedOrder.totalAmount);
    
    if (savedOrder.customerEmail) {
      try {
        // Format items for email
        const itemsHtml = (savedOrder.items || []).map(item => `
          <tr>
            <td>${item.name || 'Unknown Item'}</td>
            <td>${item.quantity || 1}</td>
            <td>₹${(parseFloat(item.price || item.discountedPrice || 0) * parseFloat(item.quantity || 1)).toFixed(2)}</td>
          </tr>
        `).join('');
        
        console.log('Sending email with items:', itemsHtml);
        
        await sendEmail({
          to: savedOrder.customerEmail,
          subject: `Order Confirmation #${savedOrder.orderNumber} - SaajJewels`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #c6a856;">Order Confirmation</h2>
              <p>Hello ${savedOrder.customerName || 'Valued Customer'},</p>
              <p>Thank you for your order! We're excited to fulfill your purchase.</p>
              
              <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0;">
                <h3>Order Details:</h3>
                <p><strong>Order Number:</strong> ${savedOrder.orderNumber}</p>
                <p><strong>Order Date:</strong> ${savedOrder.createdAt ? new Date(savedOrder.createdAt).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Total Amount:</strong> ₹${parseFloat(savedOrder.totalAmount || 0).toFixed(2)}</p>
                <p><strong>Payment Method:</strong> ${savedOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
              </div>
              
              <h3>Items Ordered:</h3>
              <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                <thead>
                  <tr>
                    <th style="text-align: left; border-bottom: 1px solid #ddd; padding: 8px;">Item</th>
                    <th style="text-align: left; border-bottom: 1px solid #ddd; padding: 8px;">Quantity</th>
                    <th style="text-align: left; border-bottom: 1px solid #ddd; padding: 8px;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml || '<tr><td colspan="3">No items found</td></tr>'}
                </tbody>
              </table>
              
              <h3>Shipping Address:</h3>
              <div style="background-color: #f9f9f9; padding: 10px; margin: 15px 0;">
                <p>${savedOrder.customerName || 'N/A'}</p>
                <p>${savedOrder.shippingAddress || 'Address not provided'}</p>
              </div>
              
              <p>We'll send you another email when your order ships. If you have any questions, feel free to contact us.</p>
              <p>Thank you for shopping with SaajJewels!</p>
              <p>The SaajJewels Team</p>
            </div>
          `
        });
        console.log(`Order confirmation email sent to ${savedOrder.customerEmail}`);
      } catch (emailError) {
        console.error('Failed to send order confirmation email:', emailError);
        // Don't fail the order creation if email fails
      }
    } else {
      console.log('No customer email provided, skipping order confirmation email');
    }
    
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: error.message });
  }
};

// Update order
exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const orderData = req.body;
    
    const [updatedRowsCount, updatedOrders] = await Order.update(
      { ...orderData, updatedAt: new Date() },
      { where: { id }, returning: true }
    );
    const updatedOrder = updatedOrders[0];
    
    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    res.json({
      success: true,
      message: "Order updated successfully",
      order: updatedOrder
    });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ error: error.message });
  }
};

// Delete order
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Deleting order with ID:', id);
    
    if (!id) {
      return res.status(400).json({ error: "Order ID is required" });
    }
    
    const deletedOrder = await Order.findByPk(id);
    if (deletedOrder) {
      await Order.destroy({ where: { id } });
    }
    console.log('Deleted order result:', deletedOrder);
    
    if (!deletedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    res.json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ error: error.message });
  }
};