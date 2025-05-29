const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // Shrani seznam značilk (vektorjev)
  features: {
    type: [[Number]], // array of arrays of floats
    required: false    // optional, če še ni 2FA aktivirano
  },
  pending2FA: { type: Boolean, default: false }
});

module.exports = mongoose.model('User', userSchema);
