require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const app = require('./app');
const env = require('./config/env');
const dbConnection = require('./config/db');
const { startMonitorWorker } = require('./workers/monitor.worker');
const mongoose = require('mongoose');

let server;

const startServer = async () => {
    try {

        await dbConnection();

        startMonitorWorker();


        const PORT = env.port || 5000;
        server = app.listen(PORT, () => {
            console.log(`Server is running beautifully on port ${PORT}`);
        });
    } catch (error) {
        console.error('Fatal startup error:', error.message);
        process.exit(1);
    }
};


process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! Shutting down...');
    console.error(err.name, err.message, err.stack);
    process.exit(1);
});


process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! Shutting down...');
    console.error(err.name, err.message, err.stack);
    if (server) {
        server.close(() => {
            mongoose.connection.close();
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
});

startServer();
