const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller.js');
const { isAdmin } = require('../controllers/product.controller.js');

// Inventory routes
router.get('/', isAdmin, inventoryController.getAllInventory);
router.get('/low-stock', isAdmin, inventoryController.getLowStockItems);
router.get('/:id', isAdmin, inventoryController.getInventoryById);
router.post('/', isAdmin, inventoryController.createInventoryItem);
router.put('/:id', isAdmin, inventoryController.updateInventoryItem);
router.delete('/:id', isAdmin, inventoryController.deleteInventoryItem);
router.post('/search', isAdmin, inventoryController.searchSimilarItems);

module.exports = router;