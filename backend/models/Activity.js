const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    activityId: { type: String, required: true },
    userEmail: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    stats: [
        {
            coords: {
                latitude: Number,
                longitude: Number,
            },
            accel: {
                x: String,
                y: String,
                z: String,
            },
            timestamp: String,
        }
    ]
});

module.exports = mongoose.model('Activity', activitySchema);
