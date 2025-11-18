const express = require('express');
const router = express.Router();
const offersController = require('../controllers/offers.controller');

// POST /offers/subscribe - Subscribe to offers and get coupon code
router.post('/subscribe', offersController.subscribeToOffers);

// GET /offers/subscribers - Get all subscribed emails (admin only)
router.get('/subscribers', offersController.getSubscribedEmails);

// GET /offers/remaining - Get remaining offer count (shared across all browsers)
router.get('/remaining', offersController.getRemainingOffers);

// GET /offers/check - Check if an email has already claimed an offer
router.get('/check', offersController.checkEmailClaimed);

// POST /offers/claim - Claim an offer (decrement remaining count)
router.post('/claim', offersController.claimOffer);

module.exports = router;