require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

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

// Zagon strežnika
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`📡 Strežnik posluša na http://localhost:${PORT}`);
});

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
