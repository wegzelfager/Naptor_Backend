const { updateStatusForUser } = require('../repositories/monitor.repository')
const {
  createMonitor,
  updateStatuesForMonitor,
  getMonitorsForUser,
  getMonitorByIdForUser,
  deleteMonitor,
  updateGlobalStatuesMonitor
} = require('../service/signal.service')

const createMonitorController = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id
    const { name, url, type, interval, timeout } = req.body
    const monitor = await createMonitor(userId, {
      name,
      url,
      type,
      interval,
      timeout
    })
    return res.status(201).json({
      status: 'success',
      message: 'Monitor created successfully',
      monitor
    })
  } catch (error) {
    next(error)
  }
}

const deletedMonitorController = async (req, res, next) => {
  const monitorId = req.params.id || req.params.monitorId;
  const userId = req.user._id || req.user.id;
  try {
    const deletedMonitor = await deleteMonitor(monitorId, userId)
    return res.status(200).json({
      status: 'success',
      message: 'Monitor deleted successfully',
      data: deletedMonitor
    })
  } catch (error) {
    next(error)
  }
}
const setNewStatuesForUserMonitorController = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const userId = req.user._id || req.user.id

    const updatedMonitor = await updateStatuesForMonitor(id, userId, status)

    return res.status(200).json({
      success: true,
      message: `Monitor status updated to ${status} successfully`,
      data: updatedMonitor
    })
  } catch (error) {
    console.error(`[UPDATE MONITOR ERROR]: ${error.message}`)

    if (error.message === 'Monitor not found or unauthorized') {
      return res.status(404).json({
        status: 'error',
        message: 'Monitor not found or you do not have permission to modify it'
      })
    }

    return res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
      error: error.message
    })
  }
}

const getMonitorsController = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id
    const monitors = await getMonitorsForUser(userId)
    return res.status(200).json({
      status: 'success',
      data: { monitors }
    })
  } catch (error) {
    next(error)
  }
}

const getMonitorByIdController = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id || req.user._id
    const monitor = await getMonitorByIdForUser(id, userId)
    return res.status(200).json({
      status: 'success',
      data: { monitor }
    })
  } catch (error) {
    if (error.message === 'Monitor not found or unauthorized') {
      return res.status(404).json({
        status: 'error',
        message: 'Monitor not found or you do not have permission to view it'
      })
    }
    next(error)
  }
}

const updateGlobalStatuesMonitorController = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user._id || req.user.id

    const updatedMonitor = await updateGlobalStatuesMonitor(userId, id, req.body)

    return res.status(200).json({
      success: true,
      message: `Monitor updated successfully`,
      data: updatedMonitor
    })
  } catch (error) {
    console.error(`[UPDATE MONITOR ERROR]: ${error.message}`)

    if (error.message === 'Monitor not found or unauthorized') {
      return res.status(404).json({
        status: 'error',
        message: 'Monitor not found or you do not have permission to modify it'
      })
    }

    return res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
      error: error.message
    })
  }
}



module.exports = {
  createMonitorController,
  setNewStatuesForUserMonitorController,
  getMonitorsController,
  getMonitorByIdController,
  deletedMonitorController,
  updateGlobalStatuesMonitorController

}
