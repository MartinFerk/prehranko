const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  clientId: { type: String, required: true, unique: true },
  status: { type: String, enum: ['connected', 'disconnected'], default: 'disconnected' },
  lastUpdated: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Device', deviceSchema);