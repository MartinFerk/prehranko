const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const mqtt = require('mqtt');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const Image = require('../models/Image');
const Obrok = require('../models/Obrok');
const { getJpegBase64 } = require('../utils/decompression');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- MQTT KONFIGURACIJA ---
const MQTT_URL = 'mqtt://prehrankomosquitto.railway.internal:1883';
const MQTT_TOPIC = 'prehranko/obroki';

const mqttClient = mqtt.connect(MQTT_URL, {
    clientId: `api_images_${Math.random().toString(16).slice(2, 8)}`,
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 5000,
});

/**
 * Pomožna funkcija za upload na Imgur
 */
async function uploadToImgur(imageBuffer) {
    console.log('--- 🛠️ Debug: Imgur Upload Start (Base64 Mode) ---');

    // 1. Izračun velikosti in priprava Base64
    const sizeInKb = (imageBuffer.length / 1024).toFixed(2);
    const base64Image = imageBuffer.toString('base64');

    console.log(`📦 Buffer size: ${sizeInKb} KB`);
    console.log(`🔤 Base64 string length: ${base64Image.length} characters`);
    console.log(`🔍 Base64 Start: ${base64Image.slice(0, 50)}...`);

    // 2. Priprava telesa (body) - točno tako, kot si imel na frontendu
    // Uporabimo URLSearchParams, da simuliramo x-www-form-urlencoded
    const params = new URLSearchParams();
    params.append('image', base64Image);
    params.append('type', 'base64');

    try {
        console.log('📡 Pošiljanje na Imgur kot URL-encoded Base64...');
        const response = await axios.post('https://api.imgur.com/3/image', params, {
            headers: {
                'Authorization': `Client-ID ${process.env.IMGUR_CLIENT_ID}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        console.log('✅ Imgur Success!');
        console.log('🔗 Link:', response.data.data.link);
        return response.data.data.link;

    } catch (error) {
        console.error('❌ --- Imgur Error Debug ---');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error Message:', error.message);
        }
        throw new Error(`Imgur upload failed: ${error.response?.data?.data?.error || error.message}`);
    }
}
// 🎯 POST /api/images/uploadimg
router.post('/uploadimg', async (req, res) => {
    const startTime = Date.now();
    const { obrokId, userEmail, compressedData, locX, locY, width, height } = req.body;

    console.log(`\n--- 🚀 Začetek procesa z Imgur URL [ID: ${obrokId}] ---`);

    if (!compressedData || !obrokId || !width || !height) {
        return res.status(400).json({ error: 'Manjkajoči podatki' });
    }

    try {
        const binaryBuffer = Buffer.from(compressedData, 'base64');

        // 1. REKONSTRUKCIJA SLIKE
        console.time('⏱️ Dekompresija');
        const b64Image = await getJpegBase64(binaryBuffer, width, height);
        const imageBuffer = Buffer.from(b64Image, 'base64');
        console.timeEnd('⏱️ Dekompresija');

        // 2. NALAGANJE NA IMGUR
        console.log('☁️ Nalaganje na Imgur...');
        const imgurUrl = await uploadToImgur(imageBuffer);
        console.log('🔗 Imgur Link:', imgurUrl);

        // 3. ANALIZA S POMOČJO OPENAI GPT-4o PREKO URL
        console.log('🧠 OpenAI analizira URL...');
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `Analiziraj sliko na tem URL-ju. 
                            Vrni izključno JSON: { "isFood": boolean, "calories": št, "protein": št, "foodName": "ime", "aiDescription": "opis" }`
                        },
                        {
                            type: 'image_url',
                            image_url: { url: imgurUrl } // GPT zdaj dobi URL namesto b64
                        },
                    ],
                },
            ],
            response_format: { type: "json_object" }
        });

        const foodData = JSON.parse(completion.choices[0].message.content);
        console.log('📝 OpenAI opis:', foodData.aiDescription);

        if (!foodData.isFood) {
            return res.status(400).json({ error: 'Hrana ni zaznana.', details: foodData.aiDescription });
        }

        // 4. SHRANJEVANJE V BAZO
        // Shranimo surovo binarno DCT obliko (za arhiv) in Imgur link (za hiter prikaz)
        const novaSlika = new Image({ obrokId, compressedData: binaryBuffer, width, height });
        const shranjenaSlika = await novaSlika.save();

        const novObrok = new Obrok({
            obrokId,
            userEmail,
            imageId: shranjenaSlika._id,
            imgLink: imgurUrl, // Dodamo polje za URL
            locX, locY,
            name: foodData.foodName,
            calories: foodData.calories,
            protein: foodData.protein
        });
        await novObrok.save();

        // 5. MQTT OBVESTILO
        if (mqttClient.connected) {
            mqttClient.publish(MQTT_TOPIC, JSON.stringify(novObrok), { qos: 1 });
        }

        console.log(`✅ Uspešno končano v ${(Date.now() - startTime)/1000}s`);
        res.status(201).json({ success: true, obrok: novObrok });

    } catch (err) {
        console.error('❌ Napaka:', err);
        res.status(500).json({ error: 'Interna napaka pri obdelavi' });
    }
});

module.exports = router;