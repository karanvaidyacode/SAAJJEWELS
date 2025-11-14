const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller.js');
const { isAdmin } = require('../controllers/product.controller.js');

// Customer routes
router.get('/', isAdmin, customerController.getCustomers);
router.get('/analytics', isAdmin, customerController.getCustomerAnalytics);
router.get('/:id', isAdmin, customerController.getCustomerById);
router.post('/', isAdmin, customerController.createCustomer);
router.put('/:id', isAdmin, customerController.updateCustomer);
router.delete('/:id', isAdmin, customerController.deleteCustomerById);

module.exports = router;