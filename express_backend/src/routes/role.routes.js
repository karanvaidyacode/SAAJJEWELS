const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller.js');
const { isAdmin } = require('../controllers/product.controller.js');

// Role routes
router.get('/', isAdmin, roleController.getAllRoles);
router.get('/:id', isAdmin, roleController.getRoleById);
router.post('/', isAdmin, roleController.createRole);
router.put('/:id', isAdmin, roleController.updateRole);
router.delete('/:id', isAdmin, roleController.deleteRole);
router.post('/check-permission', isAdmin, roleController.checkPermission);
router.post('/search-similar', isAdmin, roleController.searchSimilarRoles);

module.exports = router;