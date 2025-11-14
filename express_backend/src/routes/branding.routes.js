const express = require('express');
const router = express.Router();
const brandingController = require('../controllers/branding.controller.js');
const { isAdmin } = require('../controllers/product.controller.js');

// Branding routes
router.get('/', isAdmin, brandingController.getBrandingSettings);
router.put('/', isAdmin, brandingController.updateBrandingSettings);
router.post('/reset', isAdmin, brandingController.resetBrandingSettings);
router.post('/search-similar', isAdmin, brandingController.searchSimilarBranding);

module.exports = router;