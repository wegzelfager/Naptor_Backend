const dotenv = require('dotenv')
const path = require('path')
dotenv.config({ path: path.join(__dirname, '../.env') })
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')

const corsOptions = require('./config/corsOptions')
const authRouter = require('./routes/auth.routes')
const errorHandler = require('./middlewares/errorHandler.middleware')
const { protect } = require('./middlewares/authenticate.middleware')
const { monitorRouter } = require('./signals/routes/monitor.router')
const { incidentRouter } = require('./incidents/routes/incidents.routes')
const alertRouter = require('../alerts/routes/alert.router');
const userRouter = require('./routes/user.rotues');
const app = express()

// app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Naptor Backend API is running' });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is up and running smoothly!' });
});

app.use('/api/auth', authRouter)
app.use('/api/monitors', monitorRouter)
app.use('/api/incidents', incidentRouter)
app.use('/api/v1/incidents', incidentRouter)
app.use('/api/v1/monitors', monitorRouter)
app.use('/api/alerts', alertRouter)
app.use('/api/v1/alerts', alertRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/settings', userRouter)
app.use(errorHandler)

module.exports = app
