const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
router.post('/upload-face-image', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Slika ni bila prejeta' });

  console.log('✅ Slika prejeta od:', req.body.email);
  res.json({ message: 'Slika uspešno shranjena', filename: req.file.filename });
});

module.exports = router;
