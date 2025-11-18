const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller.js');
const { isAdmin } = require('../controllers/product.controller.js');

// Order routes
router.get('/', isAdmin, orderController.getOrders);
router.get('/analytics', isAdmin, orderController.getOrderAnalytics);
router.get('/:id', isAdmin, orderController.getOrderById);
router.post('/', orderController.createOrder);
router.put('/:id', isAdmin, orderController.updateOrder);
router.put('/:id/status', isAdmin, orderController.updateOrderStatus); // Add specific route for status updates
router.delete('/:id', isAdmin, orderController.deleteOrder);

module.exports = router;