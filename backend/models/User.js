const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  faceImages: { type: [String], default: [] },
  faceEmbeddings: {
    type: [[Number]], // 2D array, npr. [[0.1, 0.2, ...], [0.3, 0.5, ...]]
    default: [],
  },
  caloricGoal: { type: Number, default: null }, // Polje za trajni kalorični cilj - PT

});

module.exports = mongoose.model('User', userSchema);
