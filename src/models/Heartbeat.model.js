const mongoose = require('mongoose');

const heartbeatSchema = new mongoose.Schema({
    monitor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Monitor',
        required: true,
        index: true,
    },
    status: {
        type: String,
        enum: ['UP', 'DOWN'],
        required: true,
    },
    statusCode: {
        type: Number,
    },
    responseTime: {
        type: Number, 
        required: true,
    },
    error: {
        type: String,
        default: null,
    }
}, { timestamps: true });

heartbeatSchema.index({ monitor: 1, createdAt: -1 });

module.exports = mongoose.model('Heartbeat', heartbeatSchema);