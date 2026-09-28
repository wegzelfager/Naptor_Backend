const express = require('express');
const incidentRouter = express.Router();
const { getAllUserIncidents, getMonitorIncidents, getMonitorUptimeStats } = require('../controller/incident.controller');
const { protect } = require('../../middlewares/authenticate.middleware');



incidentRouter.get('/', protect, getAllUserIncidents);
incidentRouter.get('/user', protect, getAllUserIncidents);


incidentRouter.get('/:monitorId/incidents', protect, getMonitorIncidents);
incidentRouter.get('/:monitorId/uptime-stats', protect, getMonitorUptimeStats);
incidentRouter.get('/:monitorId/uptime', protect, getMonitorUptimeStats);

module.exports = { incidentRouter };
