const express = require('express');
const router = express.Router();
const customOrderController = require('../controllers/customOrder.controller.js');
const { isAdmin } = require('../controllers/product.controller.js');

// Custom Order routes
router.get('/', isAdmin, customOrderController.getAllCustomOrders);
router.get('/:id', isAdmin, customOrderController.getCustomOrderById);
router.post('/', isAdmin, customOrderController.createCustomOrder);
router.put('/:id', isAdmin, customOrderController.updateCustomOrder);
router.put('/:id/status', isAdmin, customOrderController.updateCustomOrderStatus);
router.delete('/:id', isAdmin, customOrderController.deleteCustomOrder);
router.post('/search', isAdmin, customOrderController.searchSimilarCustomOrders);

module.exports = router;