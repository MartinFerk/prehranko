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
    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Na sliki je morda hrana. Ali lahko:
        - poveš, ali je na sliki hrana?
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
