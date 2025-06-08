const express = require('express');
const router = express.Router();
const Obrok = require('../models/Obrok');
require('dotenv').config();

const mqtt = require('mqtt');
const MQTT_URL = 'mqtt://prehrankomosquitto.railway.internal:1883';
const MQTT_TOPIC = 'prehranko/obroki';

// ✅ Novi način uvoza za openai v4
const OpenAI = require('openai');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const mqttClient = mqtt.connect(MQTT_URL, {
  clientId: `api_${Math.random().toString(16).slice(2, 8)}`,
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 5000,
});

mqttClient.on('connect', () => {
  console.log('📡 MQTT client connected from obroki route');
});

mqttClient.on('error', (err) => {
  console.error('❌ MQTT error:', err.message);
});

// ✅ Novi način uvoza za openai v4
// GET /api/obroki
router.get('/', async (req, res) => {
  try {
    const obroki = await Obrok.find();
    res.json(obroki);
  } catch (err) {
    res.status(500).json({ message: 'Napaka pri pridobivanju obrokov' });
  }
});

// GET /api/obroki/all - Fetch all meals for a user
router.get('/all', async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Manjkajoč email parameter' });
  }

  try {
    const obroki = await Obrok.find({ userEmail: email }).sort({ createdAt: -1 });
    if (!obroki.length) {
      return res.status(404).json({ error: 'Ni najdenih obrokov' });
    }
    res.json(obroki);
  } catch (err) {
    console.error('Napaka pri pridobivanju vseh obrokov:', err.message);
    res.status(500).json({ error: 'Napaka pri pridobivanju vseh obrokov' });
  }
});

// 🎯 API endpoint: Analiziraj hrano iz slike
router.post('/analyze-food', async (req, res) => {
  const { obrokId, imageUrl } = req.body;

  if (!obrokId || !imageUrl) {
    return res.status(400).json({ error: 'Manjkajoč obrokId ali imageUrl' });
  }

  try {
    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Na sliki je morda hrana. Ali lahko:
        - poveš, ali je na sliki hrana?
        - Pri nadaljnih izračunih upoštevaj tudi količino hrane na sliki npr. 3 jajca, 2 rezini kruha...
        - če ja, koliko kalorij ima?
        - koliko beljakovin?
        - kakšno je ime hrane?
        Vrni JSON kot:
        { "isFood": true|false, "calories": št, "protein": št, "foodName": "ime hrane" }`,
          },
          {
            type: 'image_url',
            image_url: { url: imageUrl },
          },
        ],
      },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
    });

    const responseText = completion.choices[0].message.content.trim();
    console.log('🔍 OpenAI vizualni odgovor:', responseText);

    let foodData;
    try {
      const cleaned = responseText.replace(/```json|```/g, '').trim();
      foodData = JSON.parse(cleaned);
    } catch (e) {
      return res.status(500).json({ error: 'Odgovor OpenAI ni veljaven JSON', raw: responseText });
    }

    if (!foodData.isFood) {
      return res.status(400).json({ error: 'Na sliki ni hrane ali ni prepoznavna.' });
    }

    const updated = await Obrok.findOneAndUpdate(
      { obrokId },
      {
        calories: foodData.calories || 0,
        protein: foodData.protein || 0,
        name: foodData.foodName || 'Neznan obrok',
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Obrok ni najden' });
    const msg = `${updated.userEmail} : ${updated.name} : ${updated.calories} kcal : ${updated.protein} g beljakovin`;

    if (mqttClient.connected) {
      mqttClient.publish(MQTT_TOPIC, msg, { qos: 1 }, (err) => {
        if (err) {
          console.error('❌ Napaka pri pošiljanju MQTT sporočila:', err.message);
        } else {
          console.log('✅ MQTT sporočilo poslano:', msg);
        }
      });
    } else {
      console.warn('⚠️ MQTT client ni povezan - sporočilo NI poslano');
  }

    res.json({ success: true, obrok: updated });
  } catch (err) {
    console.error('Napaka pri analizi hrane:', err.message);
    res.status(500).json({ error: 'Napaka pri analizi hrane' });
  }
});

// 📌 POST /api/obroki/create - Ustvari obrok
router.post('/create', async (req, res) => {
  const { obrokId, userEmail, imgLink, locX, locY } = req.body;

  if (!obrokId || !userEmail || !imgLink) {
    return res.status(400).json({ error: 'Manjkajo podatki (obrokId, userEmail, imgLink)' });
  }

  try {
    const novObrok = new Obrok({
      obrokId,
      userEmail,
      imgLink,
      locX: locX || null,
      locY: locY || null,
    });

    await novObrok.save();

    res.status(201).json({ message: 'Obrok uspešno ustvarjen', obrok: novObrok });
  } catch (err) {
    console.error('Napaka pri ustvarjanju obroka:', err);
    res.status(500).json({ error: 'Napaka pri ustvarjanju obroka' });
  }
});

// 🗑️ DELETE /api/obroki/delete/:obrokId - Briši obrok
router.delete('/delete/:obrokId', async (req, res) => {
  const { obrokId } = req.params;

  try {
    const deleted = await Obrok.findOneAndDelete({ obrokId });

    if (!deleted) {
      return res.status(404).json({ error: 'Obrok ni bil najden za brisanje' });
    }

    res.json({ message: 'Obrok uspešno izbrisan', obrok: deleted });
  } catch (err) {
    console.error('Napaka pri brisanju obroka:', err.message);
    res.status(500).json({ error: 'Napaka pri brisanju obroka' });
  }
});

const { getZadnjiObrok } = require('../mqttListener');

router.get('/last', (req, res) => {
  const zadnji = getZadnjiObrok();
  if (zadnji) {
    res.json({ obrok: zadnji });
  } else {
    res.status(404).json({ error: 'Ni podatkov.' });
  }
});



module.exports = router;
