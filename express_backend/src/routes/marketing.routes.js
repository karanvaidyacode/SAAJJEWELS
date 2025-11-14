const express = require('express');
const router = express.Router();
const marketingController = require('../controllers/marketing.controller.js');
const { isAdmin } = require('../controllers/product.controller.js');

// Marketing routes
router.get('/', isAdmin, marketingController.getAllCampaigns);
router.get('/:id', isAdmin, marketingController.getCampaignById);
router.post('/', isAdmin, marketingController.createCampaign);
router.put('/:id', isAdmin, marketingController.updateCampaign);
router.delete('/:id', isAdmin, marketingController.deleteCampaign);
router.put('/:id/toggle', isAdmin, marketingController.toggleCampaignStatus);
router.post('/search', isAdmin, marketingController.searchSimilarCampaigns);

module.exports = router;