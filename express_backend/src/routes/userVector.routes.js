const express = require('express');
const router = express.Router();
const userVectorController = require('../controllers/userVector.controller.js');

// User vector routes
router.post('/add', userVectorController.addUserVector);
router.put('/update', userVectorController.updateUserVector);
router.delete('/delete/:email', userVectorController.deleteUserVector);
router.post('/search', userVectorController.searchSimilarUsers);
router.get('/:email', userVectorController.getUserVector);

module.exports = router;