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


        const primaryPort = Number(process.env.PORT) || 8080;

        server = app.listen(primaryPort, '0.0.0.0', () => {
            console.log(`=========================================`);
            console.log(`🚀 Primary server running on 0.0.0.0:${primaryPort}`);
            console.log(`👉 process.env.PORT is: ${process.env.PORT || 'undefined'}`);
            console.log(`=========================================`);
        });

        const secondaryPort = primaryPort === 5000 ? 8080 : 5000;
        try {
            const backupServer = app.listen(secondaryPort, '0.0.0.0', () => {
                console.log(`🚀 Secondary listener active on 0.0.0.0:${secondaryPort}`);
            });
            backupServer.on('error', (err) => {
                console.log(`[Notice] Port ${secondaryPort} listener:`, err.message);
            });
        } catch (e) {
            // Ignore if secondary port fails to bind
        }
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