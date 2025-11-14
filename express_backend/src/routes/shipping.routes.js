const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shipping.controller.js');
const { isAdmin } = require('../controllers/product.controller.js');

// Shipping routes
router.get('/', isAdmin, shippingController.getAllShipments);
router.get('/search', isAdmin, shippingController.searchShipments);
router.get('/:id', isAdmin, shippingController.getShipmentById);
router.post('/', isAdmin, shippingController.createShipment);
router.put('/:id', isAdmin, shippingController.updateShipment);
router.put('/:id/status', isAdmin, shippingController.updateShipmentStatus);
router.delete('/:id', isAdmin, shippingController.deleteShipment);
router.post('/search-similar', isAdmin, shippingController.searchSimilarShipments);

module.exports = router;