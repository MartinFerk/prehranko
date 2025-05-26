const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('./models/User');

const router = express.Router();

// Nastavitev shranjevanja
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const email = req.body.email?.replace(/[@.]/g, '_') || 'unknown';
    cb(null, `${email}_${Date.now()}.jpg`);
  },
});

const upload = multer({ storage });

// Endpoint za nalaganje slike
app.post('/api/upload-face-image', upload.single('image'), async (req, res) => {
  if (!req.file || !req.body.email) {
    return res.status(400).json({ message: 'Manjka slika ali email' });
  }

  try {
    // 1. Preberi datoteko iz diska
    const imageBuffer = fs.readFileSync(req.file.path);
    const imageBase64 = imageBuffer.toString('base64');

    // 2. Shrani base64 v MongoDB
    const user = await User.findOneAndUpdate(
      { email: req.body.email },
      { faceImage: imageBase64 },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Uporabnik ni najden' });
    }

    // 3. Po želji: izbriši datoteko z diska
    fs.unlinkSync(req.file.path);

    res.json({ message: 'Slika uspešno shranjena kot base64' });
  } catch (err) {
    console.error('❌ Napaka:', err);
    res.status(500).json({ message: 'Napaka pri shranjevanju slike' });
  }
});

module.exports = router;
