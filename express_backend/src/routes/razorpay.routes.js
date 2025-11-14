const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { updateCustomerFromOrder } = require('../controllers/customer.controller');

const router = express.Router();

const razorpay = new Razorpay({
  key_id: 'rzp_test_RcW2dLNPJC62oO',        // Replace with your Key ID
  key_secret: 'OPBftAm7dNkaf3t5X3LBrJ0d' // Replace with your Key Secret
});

// Endpoint to create a new Razorpay order
router.post('/create-order', async (req, res) => {
  // Extract only the parameters needed for Razorpay API
  const { amount, currency, receipt } = req.body;
  // Extract customer data separately (not passed to Razorpay)
  const { customerName, customerEmail, customerPhone, shippingAddress } = req.body;
  
  try {
    // Validate that amount is an integer
    if (!Number.isInteger(amount)) {
      return res.status(400).json({ 
        error: 'Invalid amount',
        message: 'The amount must be an integer (in paise)' 
      });
    }
    
    // Create a real order with Razorpay
    const order = await razorpay.orders.create({
      amount,
      currency: currency || 'INR',
      receipt: receipt || 'receipt_' + Date.now(),
      // Add payment capture settings for better UPI experience
      payment: {
        capture: 'automatic', // Automatically capture payment
        capture_options: {
          refund_speed: 'optimum', // Optimize refund speed
          automatic_expiry_period: 1800, // 30 minutes expiry for UPI
          manual_expiry_period: 7200, // 2 hours for manual capture
        }
      }
    });
    
    // Add customer data to the order response
    order.customerName = customerName;
    order.customerEmail = customerEmail;
    order.customerPhone = customerPhone;
    order.shippingAddress = shippingAddress;
    
    res.json(order);
  } catch (err) {
    console.error('Order creation error:', err);
    // Return proper JSON error response instead of plain text
    res.status(500).json({ 
      error: 'Error creating order',
      message: err.message || 'Unknown error occurred'
    });
  }
});

// Endpoint to verify payment and update customer data
router.post('/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderData } = req.body;
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", razorpay.key_secret)
      .update(sign.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      // Update customer data when payment is verified
      try {
        if (orderData && orderData.customerEmail) {
          await updateCustomerFromOrder({
            customerName: orderData.customerName,
            customerEmail: orderData.customerEmail,
            customerPhone: orderData.customerPhone,
            totalAmount: orderData.totalAmount || 0
          });
        }
      } catch (customerError) {
        console.error('Error updating customer from order:', customerError);
        // Don't fail the payment verification if customer update fails
      }
      
      res.json({ status: 'success' });
    } else {
      res.status(400).json({ status: 'failure', error: 'Invalid signature' });
    }
  } catch (err) {
    console.error('Payment verification error:', err);
    // Return proper JSON error response
    res.status(500).json({ 
      error: 'Error verifying payment',
      message: err.message || 'Unknown error occurred'
    });
  }
});

// Webhook endpoint for payment status updates (useful for UPI payments)
router.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  try {
    // This is a placeholder for webhook handling
    // In production, you would verify the webhook signature and process the event
    console.log('Webhook received:', req.body);
    res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ 
      error: 'Error processing webhook',
      message: err.message || 'Unknown error occurred'
    });
  }
});

module.exports = router;