const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    monitorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Monitor',
        required: true
    },
    type: {
        type: String,
        enum: ['DOWN', 'UP', 'SSL_EXPIRING', 'LATENCY_HIGH'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['SENT', 'FAILED'],
        default: 'SENT'
    },
    statusCode: Number,
    responseTime: Number
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);