const express = require('express');
const User = require('../models/User');
const { publish2FARequest } = require('../mqttListener');
const router = express.Router();

// 🧠 Helper za iskanje uporabnika in potek 2FA
const getUserAndUpdateExpiry = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return null;

  if (user.pending2FA && user.pending2FAExpires && new Date() > user.pending2FAExpires) {
    console.log(`⏰ 2FA zahteva za ${email} je potekla`);
    user.pending2FA = false;
    user.pending2FAExpires = null;
    await user.save();
  }

  return user;
};

// 🔒 Dokončaj 2FA
router.post('/complete-2fa', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email je obvezen' });

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'Uporabnik ni najden' });

    user.is2faVerified = true;
    user.pending2FA = false;
    user.pending2FAExpires = null;
    await user.save();

    console.log(`✅ 2FA dokončan za ${email}`);
    res.json({ message: '2FA uspešno dokončan' });
  } catch (err) {
    console.error('❌ Napaka pri dokončanju 2FA:', err.message);
    res.status(500).json({ error: 'Napaka strežnika' });
  }
});

// 🔎 Preveri 2FA status (s parametrom ?source=web|mobile)
router.get('/status', async (req, res) => {
  let { email, source } = req.query;
  if (!email) return res.status(400).json({ message: 'Email je zahtevan' });
  source = source || 'mobile';

  try {
    const user = await getUserAndUpdateExpiry(email);
    if (!user) return res.status(404).json({ message: 'Uporabnik ne obstaja' });

    const response = {
      is2faVerified: user.is2faVerified || false,
      pending2FA: user.pending2FA || false,
    };

    if (source === 'web') {
      // Web frontend pričakuje drugačno strukturo
      res.json({
        trigger: response.pending2FA,
        is2faVerified: response.is2faVerified,
      });
    } else {
      // Mobile pričakuje bolj neposredno
      res.json(response);
    }

    console.log(`📡 /status (${source}) za ${email}:`, response);
  } catch (err) {
    console.error('❌ Napaka pri statusu 2FA:', err.message);
    res.status(500).json({ message: 'Napaka pri preverjanju statusa' });
  }
});

module.exports = router;
