const mongoose = require('mongoose');

const monitorSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: [true, 'Please provide a monitor name'],
        trim: true,
    },
    url: {
        type: String,
        required: [true, 'Please provide a valid URL'],
        trim: true,
    },
    interval: {
        type: Number,
        default: 60,
    },
    type: {
        type: String,
        enum: ['WEBSITE', 'API'],
        default: 'WEBSITE'
    },
    timeout: {
        type: Number,
        default: 5000,
    },
    status: {
    type: String,
    enum: ['UP', 'DOWN', 'PAUSED', 'PENDING'],
    default: 'PENDING'
    },
    lastChecked: {
        type: Date,
    },
    lastResponseTime: {
        type: Number,
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    }
}, { timestamps: true });

module.exports = mongoose.model('Monitor', monitorSchema);