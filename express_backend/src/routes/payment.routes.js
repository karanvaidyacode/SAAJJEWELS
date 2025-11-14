const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller.js');
const { isAdmin } = require('../controllers/product.controller.js');

// Payment routes
router.get('/', isAdmin, paymentController.getAllPayments);
router.get('/status', isAdmin, paymentController.getPaymentsByStatus);
router.get('/:id', isAdmin, paymentController.getPaymentById);
router.post('/', isAdmin, paymentController.createPayment);
router.put('/:id', isAdmin, paymentController.updatePayment);
router.delete('/:id', isAdmin, paymentController.deletePayment);
router.post('/search', isAdmin, paymentController.searchSimilarPayments);

module.exports = router;