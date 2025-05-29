const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const FormData = require('form-data');
const fs = require('fs');

const router = express.Router();

// Registracija
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Uporabnik že obstaja' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'Registracija uspešna' });
  } catch (err) {
    res.status(500).json({ message: 'Napaka na strežniku' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password, from } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Uporabnik ne obstaja' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Napačno geslo' });

    if (from === "web") {
      // 🔐 Samo za spletno prijavo sprožimo 2FA
      user.pending2FA = true;
      await user.save();
      return res.json({ message: 'Prijava uspešna – preveri 2FA na telefonu' });
    }

    res.status(200).json({ message: 'Prijava uspešna' });
  } catch (err) {
    res.status(500).json({ message: 'Napaka na strežniku' });
  }
});

// Sproži 2FA ročno (uporablja ga frontend po loginu)
router.post('/trigger2fa', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email je obvezen" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Uporabnik ne obstaja" });

    user.pending2FA = true;
    await user.save();

    res.json({ message: "2FA sprožen" });
  } catch (err) {
    res.status(500).json({ message: "Napaka pri sprožitvi 2FA" });
  }
});

router.get('/status', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: "Email je obvezen" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Uporabnik ne obstaja" });

    res.json({ pending2FA: user.pending2FA });
  } catch (err) {
    res.status(500).json({ message: "Napaka pri preverjanju statusa" });
  }
});

router.post('/complete2fa', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email je obvezen" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Uporabnik ne obstaja" });

    user.pending2FA = false;
    await user.save();

    res.json({ message: "2FA uspešno potrjen" });
  } catch (err) {
    res.status(500).json({ message: "Napaka pri potrditvi 2FA" });
  }
});

router.post('/register-face', upload.array('images'), async (req, res) => {
  const { email } = req.body;
  const files = req.files;

  if (!email || !files || files.length < 3) {
    return res.status(400).json({ message: 'Potrebne so vsaj 3 slike in email' });
  }

  try {
    const form = new FormData();
    form.append('email', email);
    files.forEach(file => {
      form.append('images', fs.createReadStream(file.path));
    });

    const response = await axios.post('https://prehrankopython-production.up.railway.app/register', form, {
  headers: form.getHeaders(),
});


    files.forEach(f => fs.unlinkSync(f.path)); // očistimo slike

    if (response.data && response.data.message?.includes("shranjene")) {
  return res.json({ message: 'Registracija uspešna' });
    }
    else {
      return res.status(400).json({ message: response.data.message || 'Napaka' });
    }

  } catch (err) {
    console.error('❌ Napaka pri povezavi na Python strežnik:', err.message);
    return res.status(500).json({ message: 'Napaka pri komunikaciji s prepoznavo obraza' });
  }
});

router.post('/verify-face', upload.single('image'), async (req, res) => {
  const { email } = req.body;
  const file = req.file;

  if (!email || !file) {
    return res.status(400).json({ message: 'Manjka slika ali email' });
  }

  try {
    const form = new FormData();
    form.append('email', email);
    form.append('image', fs.createReadStream(file.path));

    const response = await axios.post('http://localhost:5000/verify', form, {
      headers: form.getHeaders(),
    });

    fs.unlinkSync(file.path);

    if (response.data.success) {
      return res.json({ message: 'Obraz preverjen, 2FA uspešna' });
    } else {
      return res.status(401).json({ message: 'Obraz ni prepoznan' });
    }

  } catch (err) {
    console.error('❌ Napaka pri preverjanju obraza:', err.message);
    return res.status(500).json({ message: 'Napaka pri preverjanju' });
  }
});





module.exports = router;
