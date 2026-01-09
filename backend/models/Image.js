const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    obrokId: {
        type: String, // Povezava nazaj na obrokId za lažje iskanje
        required: true,
        index: true,
    },
    // Tukaj shranimo tvoj stisnjen binarni niz (DCT + RLE)
    compressedData: {
        type: Buffer,
        required: true,
    },
    encodingType: {
        type: String,
        default: 'DCT-RLE-V1', // Verzija tvojega algoritma
    },
    width: Number,  // Shranimo dimenzije, da bomo znali dekomprimirati
    height: Number,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Image', imageSchema);