if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB povezava
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB povezava uspešna'))
  .catch(err => console.error('❌ Napaka pri povezavi z MongoDB:', err));

// Testna pot
app.get('/', (req, res) => {
  res.send('🚀 Strežnik deluje!');
});

// Avtentikacija
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// ➕ NOVO: Face Upload endpoint (brez ločenega routerja)
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const email = req.body.email?.replace(/[@.]/g, '_') || 'unknown';
    cb(null, `${email}_${Date.now()}.jpg`);
  },
});
const upload = multer({ storage });

// ➕ NOVA pot za nalaganje slike
app.post('/api/upload-face-image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Slika ni bila prejeta' });
  }

  console.log('✅ Slika prejeta od:', req.body.email);
  res.json({ message: 'Slika uspešno shranjena', filename: req.file.filename });
});

// Zagon strežnika
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`📡 Strežnik posluša na portu ${PORT}`);
});
