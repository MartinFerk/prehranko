const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

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





module.exports = router;
