const express = require('express');
const router = express.Router();
const prod = require('../controllers/product.controller');

router.get('/products/search', prod.searchProducts);
router.get('/products', prod.getAllProducts);
router.get('/products/:id', prod.getProductById);

// Admin routes (secure)
router.post('/products', prod.isAdmin, prod.uploadImage, prod.createProduct);
router.put('/products/:id', prod.isAdmin, prod.uploadImage, prod.updateProduct);
router.delete('/products/:id', prod.isAdmin, prod.deleteProduct);

module.exports = router;