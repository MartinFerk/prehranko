if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
require('./mqttListener');

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
app.use(express.json({ limit: '20mb' }));

// MongoDB povezava
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
})
  .then(() => console.log('✅ MongoDB povezava uspešna'))
  .catch(err => {
    console.error('❌ Napaka pri povezavi z MongoDB:', err.message);
    process.exit(1); // Izhod iz procesa ob napaki
  });

// Testna pot
app.get('/', (req, res) => {
  res.send('🚀 Strežnik deluje!');
});

// Poti
const obrokRoutes = require('./routes/obroki');
app.use('/api/obroki', obrokRoutes);

const activityRoutes = require('./routes/activities');
app.use('/api/activities', activityRoutes);

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const twoFactorRoutes = require('./routes/2fa');
app.use('/api/2fa', twoFactorRoutes);

// Face Upload endpoint
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

app.post('/api/upload-face-image', upload.single('image'), async (req, res) => {
  if (!req.file || !req.body.email) {
    return res.status(400).json({ message: 'Manjka slika ali email' });
  }

  try {
    const imageBuffer = fs.readFileSync(req.file.path);
    const imageBase64 = imageBuffer.toString('base64');

    const preprocessRes = await fetch('http://prehrankopython-production.up.railway.app/preprocess', {
      method: 'POST',
      body: (() => {
        const formData = new FormData();
        formData.append('image', fs.createReadStream(req.file.path));
        return formData;
      })(),
    });

    const preprocessData = await preprocessRes.json();

    if (!preprocessData.embedding) {
      return res.status(500).json({ message: 'Obdelava slike ni uspela (ni embedding)' });
    }

    const user = await User.findOneAndUpdate(
      { email: req.body.email },
      {
        $push: {
          faceImages: imageBase64,
          faceEmbeddings: preprocessData.embedding,
        },
      },
      { new: true }
    );

    fs.unlinkSync(req.file.path);

    if (!user) {
      return res.status(404).json({ message: 'Uporabnik ni najden' });
    }

    res.json({ message: 'Slika uspešno shranjena v MongoDB (base64)' });
  } catch (err) {
    console.error('❌ Napaka pri shranjevanju slike:', err.message);
    res.status(500).json({ message: 'Napaka pri shranjevanju slike' });
  }
});

app.post('/api/save-embeddings', async (req, res) => {
  const { email, embeddings } = req.body;

  if (!email || !Array.isArray(embeddings) || embeddings.length === 0) {
    return res.status(400).json({ message: 'Manjka email ali embeddings' });
  }

  try {
    const user = await User.findOneAndUpdate(
      { email },
      { $push: { faceEmbeddings: { $each: embeddings } } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Uporabnik ni najden' });
    }

    res.json({ message: 'Značilke uspešno shranjene', count: embeddings.length });
  } catch (err) {
    console.error('❌ Napaka pri shranjevanju značilk:', err.message);
    res.status(500).json({ message: 'Napaka pri shranjevanju značilk' });
  }
});

// POST IN GET ZA SHRANJEVANJE IN PRIDOBIVANJE KALORIČNEGA/BELJAKOVINSEGA CILJA
app.post('/api/goals/set', async (req, res) => {
  const { email, caloricGoal, proteinGoal } = req.body;

  console.log('📥 Prejeta zahteva za /api/goals/set:', { email, caloricGoal, proteinGoal });

  if (!email || !caloricGoal || isNaN(caloricGoal) || caloricGoal <= 0) {
    console.log('🚫 Neveljavni podatki za kalorije:', { email, caloricGoal });
    return res.status(400).json({ message: 'Manjka email ali veljaven kalorični cilj' });
  }

  if (!proteinGoal || isNaN(proteinGoal) || proteinGoal <= 0) {
    console.log('🚫 Neveljavni podatki za beljakovine:', { proteinGoal });
    return res.status(400).json({ message: 'Manjka ali neveljaven cilj za beljakovine (mora biti večji od 0)' });
  }

  try {
    const user = await User.findOneAndUpdate(
      { email },
      { 
        caloricGoal: parseInt(caloricGoal),
        proteinGoal: parseInt(proteinGoal),
      },
      { new: true }
    );

    if (!user) {
      console.log('🚫 Uporabnik ni najden:', email);
      return res.status(404).json({ message: 'Uporabnik ni najden' });
    }

    res.status(200).json({ 
      message: 'Cilji uspešno shranjeni', 
      caloricGoal: user.caloricGoal,
      proteinGoal: user.proteinGoal,
    });
  } catch (err) {
    console.error('❌ Napaka pri shranjevanju ciljev:', err.message);
    res.status(500).json({ error: 'Napaka pri shranjevanju ciljev' });
  }
});

app.get('/api/goals/get', async (req, res) => {
  const { email } = req.query;

  console.log('📥 Prejeta zahteva za /api/goals/get z email:', email);

  if (!email) {
    console.log('🚫 Manjka email');
    return res.status(400).json({ message: 'Manjka email' });
  }

  try {
    const user = await User.findOne({ email }, 'caloricGoal proteinGoal');

    if (!user) {
      console.log('🚫 Uporabnik ni najden:', email);
      return res.status(404).json({ message: 'Uporabnik ni najden' });
    }

    res.status(200).json({ 
      caloricGoal: user.caloricGoal || null,
      proteinGoal: user.proteinGoal || null,
    });
  } catch (err) {
    console.error('❌ Napaka pri pridobivanju ciljev:', err.message);
    res.status(500).json({ error: 'Napaka pri pridobivanju ciljev' });
  }
});

// Middleware za obvladovanje napak
app.use((err, req, res, next) => {
  console.error('❌ Strežniška napaka:', err.stack);
  res.status(500).json({ message: 'Napaka na strežniku', error: err.message });
});

// Zagon strežnika
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`📡 Strežnik posluša na portu ${PORT}`);
});