const { addClient } = require('../../utils/sseManager')
const HeartbeatRepository = require('../repositories/heartbeat.repository')
const MonitorRepository = require('../repositories/monitor.repository')

const streamHeartbeats = async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  res.write(
    `event: connected\ndata: ${JSON.stringify({
      message: 'SSE connected successfully'
    })}\n\n`
  )

  const userId = req.user._id.toString()
  addClient(userId, res)

  let index = 0
  const intervalId = setInterval(async () => {
    try {
      const monitors = await MonitorRepository.findAllByUser(userId)
      if (!monitors || monitors.length === 0) return

      const monitor = monitors[index % monitors.length]
      index++


      if (monitor.status === 'PAUSED') return

      const status = Math.random() > 0.05 ? 'UP' : 'DOWN'
      const data = {
        monitorId: monitor._id.toString(),
        status: status,
        responseTime: status === 'UP' ? Math.floor(40 + Math.random() * 160) : 0,
        statusCode: status === 'UP' ? 200 : 503,
        error: status === 'UP' ? null : 'Service Temporarily Unavailable',
        timestamp: new Date().toISOString()
      }

      res.write(`event: heartbeat\ndata: ${JSON.stringify(data)}\n\n`)
    } catch (err) {
      console.error('[SSE Simulation Error]', err)
    }
  }, 60000)

  res.on('close', () => {
    clearInterval(intervalId)
  })
}

const getHeartbeatsController = async (req, res, next) => {
  try {
    const { id } = req.params // monitorId
    // Fetch last 50 heartbeats from repository
    const heartbeats = await HeartbeatRepository.findByMonitorId(id, 50)
    return res.status(200).json({
      status: 'success',
      data: heartbeats
    })
  } catch (error) {
    next(error)
  }
}

module.exports = { streamHeartbeats, getHeartbeatsController }
