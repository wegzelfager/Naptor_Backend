const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  monitor: { type: mongoose.Schema.Types.ObjectId, ref: 'Monitor', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['OPEN', 'RESOLVED'], default: 'OPEN' },
  cause: { type: String, required: true },
  startedAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date },
  duration: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Incident', incidentSchema);