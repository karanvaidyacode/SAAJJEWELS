const { sendEmail } = require('../utils/email');

// Store emails temporarily (in production, use a database)
const subscribedEmails = new Set();

// Track remaining offers globally (shared across all browsers/sessions)
// In production, this should be stored in a database
let remainingOffers = 30; // Default starting count
const INITIAL_OFFER_COUNT = 30;

/**
 * Subscribe to offers and send coupon code
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.subscribeToOffers = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    
    // Check if already subscribed
    if (subscribedEmails.has(email.toLowerCase())) {
      return res.status(400).json({ 
        message: 'This email has already claimed the offer',
        couponCode: 'SAAJ10',
        remainingOffers: remainingOffers
      });
    }
    
    // Check if offers are still available
    if (remainingOffers <= 0) {
      return res.status(400).json({ 
        message: 'Sorry, all offers have been claimed',
        remainingOffers: 0
      });
    }
    
    // Add to subscribed list
    subscribedEmails.add(email.toLowerCase());
    
    // Decrement remaining offers when someone subscribes (claims the offer)
    if (remainingOffers > 0) {
      remainingOffers = Math.max(0, remainingOffers - 1);
    }
    
    // In a production app, you would save this to a database
    
    // Send email with coupon code (optional)
    try {
      await sendEmail({
        to: email,
        subject: '10% OFF Your SaajJewels Order',
        text: 'Thank you for subscribing! Use coupon code SAAJ10 at checkout to get 10% off your order.',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #c6a856;">Thank You for Subscribing to SaajJewels!</h2>
            <p>We're excited to have you join our community. As promised, here's your coupon code:</p>
            <div style="background-color: #f5f5f5; padding: 15px; text-align: center; margin: 20px 0;">
              <span style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #333;">SAAJ10</span>
            </div>
            <p>Use this code at checkout to get <strong>10% off</strong> your next order.</p>
            <p>Happy shopping!</p>
            <p>The SaajJewels Team</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // Continue even if email fails - we'll still return the coupon code
    }
    
    return res.status(200).json({
      message: 'Successfully subscribed',
      couponCode: 'SAAJ10',
      remainingOffers: remainingOffers
    });
    
  } catch (error) {
    console.error('Offer subscription error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get all subscribed emails (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getSubscribedEmails = (req, res) => {
  // In production, add authentication to ensure only admins can access this
  return res.status(200).json({
    count: subscribedEmails.size,
    emails: Array.from(subscribedEmails)
  });
};

/**
 * Get remaining offer count
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getRemainingOffers = (req, res) => {
  try {
    return res.status(200).json({
      remainingOffers: Math.max(0, remainingOffers),
      totalOffers: INITIAL_OFFER_COUNT
    });
  } catch (error) {
    console.error('Error getting remaining offers:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Claim an offer (decrement remaining count)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.claimOffer = (req, res) => {
  try {
    if (remainingOffers > 0) {
      remainingOffers = Math.max(0, remainingOffers - 1);
      return res.status(200).json({
        success: true,
        remainingOffers: remainingOffers,
        message: 'Offer claimed successfully'
      });
    } else {
      return res.status(200).json({
        success: false,
        remainingOffers: 0,
        message: 'No offers remaining'
      });
    }
  } catch (error) {
    console.error('Error claiming offer:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Check if an email has already claimed an offer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.checkEmailClaimed = (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    const isClaimed = subscribedEmails.has(email.toLowerCase());
    
    return res.status(200).json({
      claimed: isClaimed,
      remainingOffers: remainingOffers
    });
  } catch (error) {
    console.error('Error checking email claim status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};