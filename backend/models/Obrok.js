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
    // Shranjujemo referenco (ID) na binarno sliko (v tvoji Image zbirki)
    imageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Image',
        default: null,
    },
    // NOVO: Direktna povezava do slike na Imgurju (za hiter prikaz v aplikaciji)
    imgLink: {
        type: String,
        default: null,
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
    // DODATNO: Opis, ki ga generira AI (pomaga razumeti zakaj takšne kalorije)
    aiDescription: {
        type: String,
        default: '',
    }
});

module.exports = mongoose.model('Obrok', obrokSchema);