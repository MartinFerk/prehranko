const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

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

  if (!email || !files || files.length === 0) {
    return res.status(400).json({ message: 'Manjkajo podatki ali slike' });
  }

  try {
    // TODO: pokliči Python API, shrani značilke itd.
    return res.json({ message: 'Značilke uspešno registrirane' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Napaka pri registraciji obraznih značilk' });
  }
});






module.exports = router;
