const express = require('express');
const router = express.Router();
const productVectorController = require('../controllers/productVector.controller.js');

// Product vector routes
router.post('/add', productVectorController.addProductVector);
router.put('/update', productVectorController.updateProductVector);
router.delete('/delete/:id', productVectorController.deleteProductVector);
router.post('/search', productVectorController.searchSimilarProducts);
router.get('/:id', productVectorController.getProductVector);

module.exports = router;