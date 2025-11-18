const express = require('express');
const router = express.Router();
const communicationController = require('../controllers/communication.controller.js');
const { isAdmin } = require('../controllers/product.controller.js');

// Communication routes
router.get('/', isAdmin, communicationController.getAllCommunications);
router.get('/search', isAdmin, communicationController.searchCommunications);
router.get('/:id', isAdmin, communicationController.getCommunicationById);
router.post('/', isAdmin, communicationController.createCommunication);
router.put('/:id', isAdmin, communicationController.updateCommunication);
router.delete('/:id', isAdmin, communicationController.deleteCommunication);
router.post('/:id/send', isAdmin, communicationController.sendCommunication);
router.post('/search-similar', isAdmin, communicationController.searchSimilarCommunications);

module.exports = router;