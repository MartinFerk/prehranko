const express = require('express');
const router = express.Router();
const Obrok = require('../models/Obrok');
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

// Konfiguracija OpenAI
const OpenAI = require('openai');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


// 🎯 API endpoint: Analiziraj hrano iz slike
router.post('/analyze-food', async (req, res) => {
  const { obrokId, imageUrl } = req.body;

  if (!obrokId || !imageUrl) {
    return res.status(400).json({ error: 'Manjkajoč obrokId ali imageUrl' });
  }

  try {
    // Pošlji prompt GPT-ju
    const prompt = `Na sliki (${imageUrl}) je obrok. Opiši hrano in oceni približno:
- Koliko kalorij vsebuje?
- Koliko gramov beljakovin?

Vrnjen format naj bo JSON kot:
{ "calories": ..., "protein": ..., "foodName": "..." }`;

    const completion = await openai.createChatCompletion({
      model: 'gpt-4-1106-preview', // ali "gpt-4o" če imaš dostop
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = completion.data.choices[0].message.content.trim();

    // Parsanje odgovora kot JSON
    let foodData;
    try {
      foodData = JSON.parse(responseText);
    } catch (e) {
      return res.status(500).json({ error: 'Odgovor OpenAI ni veljaven JSON', raw: responseText });
    }

    // Shrani podatke v obstoječi obrok
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

module.exports = router;
