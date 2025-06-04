const express = require('express');
const router = express.Router();
const Obrok = require('../models/Obrok');
require('dotenv').config();

// ✅ Novi način uvoza za openai v4
const OpenAI = require('openai');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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

// 🎯 API endpoint: Analiziraj hrano iz slike
router.post('/analyze-food', async (req, res) => {
  const { obrokId, imageUrl } = req.body;

  if (!obrokId || !imageUrl) {
    return res.status(400).json({ error: 'Manjkajoč obrokId ali imageUrl' });
  }

  try {
    const prompt = `Na sliki (${imageUrl}) je obrok. Opiši hrano in oceni približno:
- Koliko kalorij vsebuje?
- Koliko gramov beljakovin?
Vrnjen format naj bo JSON kot:
{ "calories": ..., "protein": ..., "foodName": "..." }`;

    // ✅ Klic z novim clientom in gpt-4o-mini
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = completion.choices[0].message.content.trim();

    let foodData;
    try {
      foodData = JSON.parse(responseText);
    } catch (e) {
      return res.status(500).json({ error: 'Odgovor OpenAI ni veljaven JSON', raw: responseText });
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

    res.json({ success: true, obrok: updated });
  } catch (err) {
    console.error('Napaka pri analizi hrane:', err.message);
    res.status(500).json({ error: 'Napaka pri analizi hrane' });
  }
});

// 📌 POST /api/obroki/create - Ustvari obrok
router.post('/create', async (req, res) => {
  const { obrokId, userEmail, imgLink } = req.body;

  if (!obrokId || !userEmail || !imgLink) {
    return res.status(400).json({ error: 'Manjkajo podatki (obrokId, userEmail, imgLink)' });
  }

  try {
    const novObrok = new Obrok({
      obrokId,
      userEmail,
      imgLink,
    });

    await novObrok.save();

    res.status(201).json({ message: 'Obrok uspešno ustvarjen', obrok: novObrok });
  } catch (err) {
    console.error('Napaka pri ustvarjanju obroka:', err);
    res.status(500).json({ error: 'Napaka pri ustvarjanju obroka' });
  }
});


module.exports = router;
