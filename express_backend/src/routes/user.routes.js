const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/user.controller');

// --- Cart ---
router.get('/cart', userCtrl.getCart); // ? auth via header
router.post('/cart', userCtrl.updateCart);
router.delete('/cart', userCtrl.clearCart);
// --- Addresses ---
router.get('/addresses', userCtrl.getAddresses);
router.post('/addresses', userCtrl.addAddress);
router.put('/addresses/:id', userCtrl.updateAddress);
router.delete('/addresses/:id', userCtrl.deleteAddress);
// --- Orders ---
router.get('/orders', userCtrl.getOrders);
router.get('/orders/:id', userCtrl.getOrderById);
router.post('/orders', userCtrl.addOrder);

module.exports = router;
