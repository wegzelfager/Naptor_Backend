const express = require('express');
const alertRouter = express.Router();
const { getAllAlerts, streamAlertsController } = require('../controllers/alert.controller');
const { protect } = require('../../src/middlewares/authenticate.middleware');

alertRouter.get('/stream', protect, streamAlertsController);
alertRouter.get('/history', protect, getAllAlerts);
alertRouter.get('/', protect, getAllAlerts);

module.exports = alertRouter;
