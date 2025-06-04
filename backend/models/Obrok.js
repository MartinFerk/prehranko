const mongoose = require('mongoose');

const obrokSchema = new mongoose.Schema({
    obrokId: {
        type: String,
        required: true,
        unique: true,
    },
    userEmail: {
        type: String,
        required: true,
        ref: 'User',
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    locX: {
        type: Number,
        default: null,
    },
    locY: {
        type: Number,
        default: null,
    },
    imgLink: {
        type: String,
        default: '',
    },
    calories: {
        type: Number,
        default: 0,
    },
    protein: {
        type: Number,
        default: 0,
    },
    name: {
        type: String,
        default: 'Nov obrok',
    },
});

module.exports = mongoose.model('Obrok', obrokSchema);
