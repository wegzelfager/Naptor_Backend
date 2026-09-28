const express = require('express')
const { signalRouter } = require('./heartbeat.routes')
const validate = require('../../middlewares/validate.middleware')
const { createMonitorSchema, globalUpdateMonitorStatusSchema } = require('../../dtos/signal.dto')
const { updateStatusSchema } = require('../../dtos/signal.dto')
const {
  createMonitorController,
  setNewStatuesForUserMonitorController,
  getMonitorsController,
  getMonitorByIdController,
  deletedMonitorController,
  updateGlobalStatuesMonitorController
} = require('../controllers/signal.controller')
const { protect } = require('../../middlewares/authenticate.middleware')
const monitorRouter = express.Router()

monitorRouter.use(protect)


monitorRouter.get('/', getMonitorsController)


monitorRouter.get('/:id', getMonitorByIdController)

const { getHeartbeatsController } = require('../controllers/heartbeat.controller')
monitorRouter.get('/:id/heartbeats', getHeartbeatsController)

monitorRouter.delete('/:id', deletedMonitorController)


monitorRouter.post(
  '/monitors',
  validate(createMonitorSchema),
  createMonitorController
)


monitorRouter.patch(
  '/:id/status',
  validate(updateStatusSchema),
  setNewStatuesForUserMonitorController
)

monitorRouter.patch(
  '/:id/global-status',
  validate(globalUpdateMonitorStatusSchema),
  updateGlobalStatuesMonitorController
)

monitorRouter.use('/heartbeats', signalRouter)

module.exports = { monitorRouter }
