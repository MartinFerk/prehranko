const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  faceImages: { type: [String], default: [] },
  faceEmbeddings: {
    type: [[Number]], // 2D array, npr. [[0.1, 0.2, ...], [0.3, 0.5, ...]]
    default: [],
  },
  caloricGoal: { type: Number, default: 2000 }, // Polje za trajni kalorični cilj - PT
  proteinGoal: { type: Number, default: 200 }, // Polje za trajni kalorični cilj - PT
  devices: [
    {
      deviceId: { type: String, required: true}, // Edinstven ID naprave, npr. UUID
      deviceName: { type: String, default: "" }, // Ime naprave (npr. "iPhone 12")
      clientId: { type: String, default: "" }, // MQTT clientId za sledenje povezave
      lastConnected: { type: Date, default: null }, // Zadnja povezava
      isConnected: { type: Boolean, default: false }, // Status povezave
    },
  ],
  is2faVerified: {type: Boolean, default: false },
  pending2FA: { type: Boolean, default: false },
  pending2FAExpires: { type: Date, default: null },
});

module.exports = mongoose.model("User", userSchema);
