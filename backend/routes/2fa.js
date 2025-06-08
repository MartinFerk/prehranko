const express = require('express');
const User = require('../models/User');
const { publish2FARequest } = require('../mqttListener');
const router = express.Router();

// Sproži 2FA (onemogočeno za zdaj, razen za testiranje)
// router.post('/trigger-2fa', async (req, res) => {
//   try {
//     const { email } = req.body;
//     if (!email) {
//       return res.status(400).json({ error: 'Manjka email' });
//     }

//     const user = await User.findOne({ email: email.toLowerCase() });
//     if (!user) {
//       return res.status(404).json({ error: 'Uporabnik ni najden' });
//     }

//     user.pending2FA = true;
//     user.pending2FAExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minut
//     await user.save();

//     console.log(`🔐 2FA sprožen za ${email}`);

//     publish2FARequest(email);

//     res.json({ message: '2FA zahteva sprožena' });
//   } catch (err) {
//     console.error('❌ Napaka pri sprožitvi 2FA:', err.message);
//     res.status(500).json({ error: 'Napaka pri sprožitvi 2FA' });
//   }
// });

// Dokončaj 2FA
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

    return res.json({ message: '2FA uspešno dokončan' });
  } catch (err) {
    console.error('❌ Napaka pri dokončanju 2FA:', err.message);
    res.status(500).json({ error: 'Napaka strežnika' });
  }
});

// Preveri 2FA status
router.get('/check-2fa', async (req, res) => {
  let { email } = req.query;
  if (!email) return res.status(400).json({ message: 'Email je zahtevan' });
  email = email.toLowerCase();

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Uporabnik ne obstaja' });

    if (user.pending2FA && user.pending2FAExpires && new Date() > user.pending2FAExpires) {
      console.log(`⏰ 2FA zahteva za ${email} je potekla`);
      user.pending2FA = false;
      user.pending2FAExpires = null;
      await user.save();
    }

    console.log(`📡 /check-2fa za ${email}:`, {
      pending2FA: user.pending2FA,
      is2faVerified: user.is2faVerified,
      pending2FAExpires: user.pending2FAExpires,
    });

    res.json({
      trigger: user.pending2FA || false,
      is2faVerified: user.is2faVerified || false,
    });
  } catch (err) {
    console.error('❌ Napaka pri preverjanju 2FA:', err.message);
    res.status(500).json({ message: 'Napaka pri preverjanju statusa' });
  }
});

// Preveri 2FA status (za mobilno aplikacijo)
router.get('/status', async (req, res) => {
  let { email } = req.query;
  if (!email) return res.status(400).json({ message: 'Email je zahtevan' });
  email = email.toLowerCase();

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Uporabnik ne obstaja' });

    if (user.pending2FA && user.pending2FAExpires && new Date() > user.pending2FAExpires) {
      console.log(`⏰ 2FA zahteva za ${email} je potekla`);
      user.pending2FA = false;
      user.pending2FAExpires = null;
      await user.save();
    }

    console.log(`📡 /status za ${email}:`, {
      pending2FA: user.pending2FA,
      is2faVerified: user.is2faVerified,
      pending2FAExpires: user.pending2FAExpires,
    });

    res.json({
      pending2FA: user.pending2FA || false,
      is2faVerified: user.is2faVerified || false,
    });
  } catch (err) {
    console.error('❌ Napaka pri preverjanju 2FA statusa:', err.message);
    res.status(500).json({ message: 'Napaka pri preverjanju statusa' });
  }
});

module.exports = router;