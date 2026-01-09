const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const mqtt = require('mqtt');
const fs = require('fs');
const path = require('path');

const Image = require('../models/Image');
const Obrok = require('../models/Obrok');
const { getJpegBase64 } = require('../utils/decompression');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- MQTT KONFIGURACIJA ---
const MQTT_URL = 'mqtt://prehrankomosquitto.railway.internal:1883';
const MQTT_TOPIC = 'prehranko/obroki'; // Uporabimo to konstanto spodaj

const mqttClient = mqtt.connect(MQTT_URL, {
    clientId: `api_images_${Math.random().toString(16).slice(2, 8)}`,
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 5000,
});

router.post('/uploadimg', async (req, res) => {
    const startTime = Date.now();
    const { obrokId, userEmail, compressedData, locX, locY, width, height } = req.body;

    console.log(`\n--- 🚀 Začetek procesa [ID: ${obrokId}] ---`);

    if (!compressedData || !obrokId || !width || !height) {
        return res.status(400).json({ error: 'Manjkajoči podatki' });
    }

    try {
        const binaryBuffer = Buffer.from(compressedData, 'base64');

        // 1. REKONSTRUKCIJA SLIKE
        console.time('⏱️ Dekompresija in Sharp');
        const b64Image = await getJpegBase64(binaryBuffer, width, height);
        console.timeEnd('⏱️ Dekompresija in Sharp');

        // Debug shranjevanje
        const debugPath = path.join(__dirname, '..', `debug_${obrokId}.jpg`);
        fs.writeFileSync(debugPath, Buffer.from(b64Image, 'base64'));

        // 2. ANALIZA S POMOČJO OPENAI GPT-4o
        console.log('🧠 Pošiljanje na OpenAI...');
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `Analiziraj sliko. 
                            1. Če je na sliki hrana, vrni "isFood": true in oceni kalorije/proteine.
                            2. Če na sliki NI hrane ali je slika nejasna, vrni "isFood": false, kalorije/proteine nastavi na 0.
                            3. V VSAKEM PRIMERU v polju "aiDescription" podrobno opiši, kaj vidiš (npr. "vidi se krožnik s testeninami", "vidim samo barvne lise in kocke", "slika je popolnoma črna").
                            Vrni izključno JSON: { "isFood": boolean, "calories": št, "protein": št, "foodName": "ime", "aiDescription": "opis" }`
                        },
                        {
                            type: 'image_url',
                            image_url: { url: `data:image/jpeg;base64,${b64Image}`, detail: "low" }
                        },
                    ],
                },
            ],
            response_format: { type: "json_object" }
        });

        const foodData = JSON.parse(completion.choices[0].message.content);
        console.log('📝 OpenAI opis slike:', foodData.aiDescription);

        if (!foodData.isFood) {
            console.warn(`🚫 Hrana ni bila zaznana: ${foodData.aiDescription}`);
            return res.status(400).json({
                error: 'Na sliki ni bila zaznana hrana.',
                details: foodData.aiDescription
            });
        }

        // 3. SHRANJEVANJE V BAZO
        const novaSlika = new Image({ obrokId, compressedData: binaryBuffer, width, height });
        const shranjenaSlika = await novaSlika.save();

        const novObrok = new Obrok({
            obrokId,
            userEmail,
            imageId: shranjenaSlika._id,
            locX, locY,
            name: foodData.foodName,
            calories: foodData.calories,
            protein: foodData.protein
        });
        await novObrok.save();

        // 4. MQTT OBVESTILO
        if (mqttClient.connected) {
            // Pomembno: JSON.stringify in uporaba MQTT_TOPIC konstante
            mqttClient.publish(MQTT_TOPIC, JSON.stringify(novObrok), { qos: 1 });
            console.log('📡 MQTT sporočilo poslano na:', MQTT_TOPIC);
        }

        console.log(`✅ Uspešno končano v ${(Date.now() - startTime)/1000}s`);
        res.status(201).json({ success: true, obrok: novObrok });

    } catch (err) {
        console.error('❌ Napaka v procesu:', err);
        res.status(500).json({ error: 'Interna napaka pri obdelavi slike' });
    }
});

module.exports = router;