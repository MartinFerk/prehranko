const express = require('express');
const router = express.Router();
const Obrok = require('../models/Obrok');
require('dotenv').config();

// MQTT konfiguracija ostane za "last" endpoint in morebitne ročne posodobitve
const mqtt = require('mqtt');
const MQTT_URL = 'mqtt://prehrankomosquitto.railway.internal:1883';
const MQTT_TOPIC = 'prehranko/obroki';

const mqttClient = mqtt.connect(MQTT_URL, {
  clientId: `api_obroki_${Math.random().toString(16).slice(2, 8)}`,
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 5000,
});

// GET /api/obroki/all - Pridobi vse obroke uporabnika (za zgodovino na Home screenu)
router.get('/all', async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Manjkajoč email parameter' });
  }

  try {
    // Uporabimo .populate('imageId'), če želimo zraven dobiti metapodatke slike
    const obroki = await Obrok.find({ userEmail: email }).sort({ timestamp: -1 });
    res.json(obroki);
  } catch (err) {
    console.error('Napaka pri pridobivanju obrokov:', err.message);
    res.status(500).json({ error: 'Napaka na strežniku' });
  }
});

// 🗑️ DELETE /api/obroki/delete/:obrokId - Briši obrok in pripadajočo sliko
router.delete('/delete/:obrokId', async (req, res) => {
  const { obrokId } = req.params;
  const Image = require('../models/Image'); // Uvozimo model slike za brisanje

  try {
    // 1. Poiščemo obrok
    const obrok = await Obrok.findOne({ obrokId });
    if (!obrok) {
      return res.status(404).json({ error: 'Obrok ni najden' });
    }

    // 2. Izbrišemo sliko iz zbirke Image (če obstaja)
    if (obrok.imageId) {
      await Image.findByIdAndDelete(obrok.imageId);
    }

    // 3. Izbrišemo obrok
    await Obrok.deleteOne({ obrokId });

    res.json({ message: 'Obrok in slika uspešno izbrisana' });
  } catch (err) {
    console.error('Napaka pri brisanju:', err.message);
    res.status(500).json({ error: 'Napaka pri brisanju' });
  }
});

// 🏠 GET /api/obroki/last - Za prikaz zadnjega obroka na dashboardu (preko MQTT listenerja)
const { getZadnjiObrok } = require('../mqttListener');
router.get('/last', (req, res) => {
  res.set('Cache-Control', 'no-store');
  const zadnji = getZadnjiObrok();
  if (zadnji) {
    res.json({ obrok: zadnji });
  } else {
    res.status(404).json({ error: 'Ni podatkov o zadnjem obroku.' });
  }
});

module.exports = router;