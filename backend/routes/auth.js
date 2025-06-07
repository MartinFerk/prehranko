// auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const FormData = require('form-data');
const fs = require('fs');

const router = express.Router();

const pending2FA = new Map();

// Registracija (ohranjamo nespremenjeno)
router.post('/register', async (req, res) => {
  const { username ,email, password } = req.body;

  try {
    const userExists = await User.findOne({ email, username });
    if (userExists) return res.status(400).json({ message: 'Uporabnik že obstaja' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username,email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'Registracija uspešna' });
  } catch (err) {
    res.status(500).json({ message: 'Napaka na strežniku' });
  }
});

router.post('/update-goals', async (req, res) => {
  const { email, caloricGoal, proteinGoal } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email je obvezen' });
  }

  try {
    const user = await User.findOneAndUpdate(
        { email },
        {
          caloricGoal: caloricGoal ?? null,
          proteinGoal: proteinGoal ?? null,
        },
        { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Uporabnik ni najden' });
    }

    res.json({
      message: 'Cilji uspešno posodobljeni',
      caloricGoal: user.caloricGoal,
      proteinGoal: user.proteinGoal,
    });
  } catch (err) {
    console.error('❌ Napaka pri posodabljanju ciljev:', err);
    res.status(500).json({ message: 'Napaka na strežniku' });
  }
});


// Prijava
router.post('/login', async (req, res) => {
  const { email, password, from, deviceId, deviceName, clientId } = req.body;

  try {
    // Preveri, ali uporabnik obstaja
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Uporabnik ne obstaja' });

    // Preveri geslo
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Napačno geslo' });

    // Posodobi ali dodaj napravo
    if (deviceId && clientId) {
      const deviceExists = user.devices.find((d) => d.deviceId === deviceId);
      if (deviceExists) {
        // Posodobi obstoječo napravo
        await User.updateOne(
          { _id: user._id, 'devices.deviceId': deviceId },
          {
            $set: {
              'devices.$.deviceName': deviceName || deviceExists.deviceName,
              'devices.$.clientId': clientId,
              'devices.$.lastConnected': new Date(),
              'devices.$.isConnected': true,
            },
          }
        );
        console.log(`✅ Updated device ${deviceId} for user ${email}`);
      } else {
        // Dodaj novo napravo
        user.devices.push({
          deviceId,
          deviceName: deviceName || '',
          clientId,
          lastConnected: new Date(),
          isConnected: true,
        });
        await user.save();
        console.log(`✅ Registered new device ${deviceId} for user ${email}`);
      }
    }

    // Logika za 2FA
    if (from === 'web') {
      user.pending2FA = true;
      user.is2faVerified = false;  // 🔴 ponastavi 2FA na začetku
      await user.save();
      return res.json({ message: 'Prijava uspešna – preveri 2FA na telefonu' });
    }


    res.status(200).json({
      message: 'Prijava uspešna',
      user: {
        email: user.email,
        username: user.username || 'Uporabnik',
        caloricGoal: user.caloricGoal,
        proteinGoal: user.proteinGoal,
        is2faVerified: user.is2faVerified,
        _id: user._id,
      },
    });

  } catch (err) {
    console.error('❌ Error during login:', err.message);
    res.status(500).json({ message: 'Napaka na strežniku' });
  }
});

// Nov endpoint za odjavo
router.post('/logout', async (req, res) => {
  const { email, deviceId } = req.body;

  if (!email || !deviceId) {
    return res.status(400).json({ message: 'Email in deviceId sta obvezna' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Uporabnik ne obstaja' });
    }

    // Preverjanje, ali naprava obstaja
    const deviceExists = user.devices.find((d) => d.deviceId === deviceId);
    if (!deviceExists) {
      return res.status(404).json({ message: 'Naprava ni najdena' });
    }

    // Posodobitev statusa naprave
    await User.updateOne(
      { _id: user._id, 'devices.deviceId': deviceId },
      {
        $set: {
          'devices.$.isConnected': false,
          'devices.$.lastConnected': new Date(),
        },
      }
    );

    console.log(`✅ Device ${deviceId} disconnected for user ${email}`);
    res.status(200).json({ message: 'Odjava uspešna' });
  } catch (err) {
    console.error('❌ Error during logout:', err.message);
    res.status(500).json({ message: 'Napaka na strežniku' });
  }
});

router.post('/trigger2fa', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email je zahtevan' });

  pending2FA.set(email, true);
  console.log(`🔐 2FA triggered for ${email}`);
  res.json({ message: '2FA sprožen' });
});

router.get('/status', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: 'Email je obvezen' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Uporabnik ne obstaja' });

    res.json({ pending2FA: user.pending2FA });
  } catch (err) {
    res.status(500).json({ message: 'Napaka pri preverjanju statusa' });
  }
});

// POST /auth/complete-2fa
router.post('/complete-2fa', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email je obvezen' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'Uporabnik ni najden' });

    // Tukaj recimo dodamo flag "is2faVerified"
    user.is2faVerified = true;
    await user.save();

    return res.json({ message: '2FA uspešno dokončan' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Napaka strežnika' });
  }
});

router.post('/register-face', upload.array('images'), async (req, res) => {
  const { email } = req.body;
  const files = req.files;

  if (!email || !files || files.length < 5) {
    return res.status(400).json({ message: 'Potrebnih je 5 slik in email' });
  }

  try {
    const form = new FormData();
    form.append('email', email);
    files.forEach((file) => {
      form.append('images', fs.createReadStream(file.path));
    });

    const response = await axios.post('https://prehrankopython-production.up.railway.app/register', form, {
      headers: form.getHeaders(),
    });

    files.forEach((f) => fs.unlinkSync(f.path)); // Počistimo slike

    if (response.data.registered) {
      return res.json({ message: '✅ Registracija obraznih značilk uspešna' });
    } else {
      return res.status(400).json({ message: response.data.error || 'Napaka pri registraciji' });
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

    const response = await axios.post('https://prehranko-production.up.railway.app/api/auth/verify', form, {
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

router.post('/upload-face-image', upload.array('images', 5), async (req, res) => {
  const { email } = req.body;
  const files = req.files;

  if (!email || !files || files.length < 3) {
    return res.status(400).json({ message: 'Potrebne so vsaj 3 slike in email' });
  }

  const form = new FormData();
  form.append('email', email);
  files.forEach((file) => {
    form.append('images', fs.createReadStream(file.path));
  });

  try {
    const response = await axios.post('https://prehranko-production.up.railway.app/api/register-face', form, {
      headers: form.getHeaders(),
    });

    files.forEach((f) => fs.unlinkSync(f.path));

    if (response.data.success) {
      return res.json({ message: 'Uspeh', result: response.data });
    } else {
      return res.status(400).json({ message: response.data.message || 'Napaka v prepoznavi obraza' });
    }
  } catch (err) {
    console.error('❌ Napaka pri povezavi na Python strežnik:', err.message);
    return res.status(500).json({ message: 'Napaka pri komunikaciji s prepoznavo obraza' });
  }
});

router.post('/save-features', async (req, res) => {
  const { email, features } = req.body;
  if (!email || !features || !Array.isArray(features)) {
    return res.status(400).json({ message: 'Manjka email ali značilke' });
  }

  try {
    const result = await User.findOneAndUpdate(
      { email },
      { features }, // Posodobi faceEmbeddings namesto features
      { new: true }
    );
    if (!result) {
      return res.status(404).json({ message: 'Uporabnik ni bil najden' });
    }
    res.json({ success: true, updated: true });
  } catch (err) {
    console.error('❌ Napaka pri shranjevanju značilk:', err);
    res.status(500).json({ message: 'Napaka pri shranjevanju značilk' });
  }
});


router.get('/finish-login', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: 'Email je potreben' });

  try {
    const user = await User.findOne({ email });

    if (!user || !user.is2faVerified) {
      return res.status(401).json({ message: '2FA še ni bila dokončana' });
    }

    res.json({
      message: 'Prijava uspešna',
      user: {
        email: user.email,
        username: user.username || 'Uporabnik',
        caloricGoal: user.caloricGoal,
        proteinGoal: user.proteinGoal,
        is2faVerified: user.is2faVerified,
        _id: user._id,
      }
    });
  } catch (err) {
    console.error('❌ Napaka pri finish-login:', err.message);
    res.status(500).json({ message: 'Napaka na strežniku' });
  }
});


// Na PRAVI LOKACIJI (zgoraj, pred exportom)
router.get('/check-2fa', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: 'Email je zahtevan' });

  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: 'Uporabnik ne obstaja' });

    const trigger = pending2FA.get(email) || false;
    const is2faVerified = user.is2faVerified || false;

    res.json({ trigger, is2faVerified });
  } catch (err) {
    console.error('❌ Napaka pri preverjanju 2FA:', err);
    res.status(500).json({ message: 'Napaka pri preverjanju statusa' });
  }
});


router.get('/embeddings', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: 'Email je potreben' });

  const user = await User.findOne({ email });
  if (!user || !user.faceEmbeddings) {
    return res.status(404).json({ message: 'Ni značilk za tega uporabnika' });
  }

  res.json({ faceEmbeddings: user.faceEmbeddings });
});

// GET /auth/user?email=...
router.get('/user', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: 'Email je potreben' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Uporabnik ni najden' });

    res.setHeader('Cache-Control', 'no-store'); // prepreči 304 response

    res.json({
      user: {
        email: user.email,
        username: user.username || 'Uporabnik',
        caloricGoal: user.caloricGoal,
        proteinGoal: user.proteinGoal,
        is2faVerified: user.is2faVerified,
        _id: user._id,
      }
    });
  } catch (err) {
    console.error('❌ Napaka pri pridobivanju uporabnika:', err);
    res.status(500).json({ message: 'Napaka strežnika' });
  }
});


module.exports = router;