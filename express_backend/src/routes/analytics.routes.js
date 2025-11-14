const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller.js');
const { isAdmin } = require('../controllers/product.controller.js');

// Analytics routes
router.get('/dashboard', isAdmin, analyticsController.getDashboardStats);
router.get('/sales', isAdmin, analyticsController.getSalesData);
router.get('/orders', isAdmin, analyticsController.getOrderStats);
router.get('/customers', isAdmin, analyticsController.getCustomerAnalytics);
router.get('/products', isAdmin, analyticsController.getProductPerformance);
router.post('/search', isAdmin, analyticsController.searchAnalytics);
router.post('/update', isAdmin, analyticsController.updateAnalytics);

module.exports = router;