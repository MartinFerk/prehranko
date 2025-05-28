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

// Prijava
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

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

router.get('/check2fa', async (req, res) => {
  const user = await User.findOne({ email: req.query.email });
  res.json({ pending2FA: user?.pending2FA || false });
});


module.exports = router;
