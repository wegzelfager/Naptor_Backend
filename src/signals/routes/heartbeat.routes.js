const express = require('express')
const { protect } = require('../../middlewares/authenticate.middleware')
const { streamHeartbeats } = require('../controllers/heartbeat.controller')
const signalRouter = express.Router()

signalRouter.get('/stream', protect, streamHeartbeats)
module.exports = { signalRouter }
