if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const User = require('./models/User');

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

const activityRoutes = require('./routes/activities');
app.use('/api/activities', activityRoutes);

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
app.post('/api/upload-face-image', upload.single('image'), async (req, res) => {
  if (!req.file || !req.body.email) {
    return res.status(400).json({ message: 'Manjka slika ali email' });
  }

  try {
    // 1. Preberi sliko kot binarno
    const imageBuffer = fs.readFileSync(req.file.path);
    const imageBase64 = imageBuffer.toString('base64');

    // 2. Shrani base64 direktno v MongoDB
    const user = await User.findOneAndUpdate(
      { email: req.body.email },
      { faceImage: imageBase64 },
      { new: true }
    );

    // 3. Počisti datoteko iz diska (ni več potrebna)
    fs.unlinkSync(req.file.path);

    if (!user) {
      return res.status(404).json({ message: 'Uporabnik ni najden' });
    }

    res.json({ message: 'Slika uspešno shranjena v MongoDB (base64)' });
  } catch (err) {
    console.error('❌ Napaka pri shranjevanju slike:', err);
    res.status(500).json({ message: 'Napaka pri shranjevanju slike' });
  }
});


// Zagon strežnika
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`📡 Strežnik posluša na portu ${PORT}`);
});
