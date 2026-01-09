const express = require('express');
const router = express.Router();
const sharp = require('sharp');
const OpenAI = require('openai');
const mqtt = require('mqtt');

// Uvoz modelov
const Image = require('../models/Image');
const Obrok = require('../models/Obrok');

// Uvoz dekompresijske logike
const { decompressImage } = require('../utils/decompression');

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

mqttClient.on('connect', () => {
    console.log('📡 MQTT povezan v images route');
});

mqttClient.on('error', (err) => {
    console.error('❌ MQTT napaka:', err.message);
});

/**
 * POMOŽNA FUNKCIJA: Pretvori DCT/RLE podatke v Base64 sliko za OpenAI
 */
const getJpegBase64 = async (compressedBuffer, width, height) => {
    try {
        // 1. Dekompresija (RLE decode -> IDCT) do surovih pikslov
        const rawPixels = decompressImage(compressedBuffer, width, height);

        // 2. Uporaba Sharp za pretvorbo v JPEG format
        // channels: 1 pomeni, da delamo z grayscale sliko (DCT svetilnost)
        const jpegBuffer = await sharp(rawPixels, {
            raw: {
                width: width,
                height: height,
                channels: 1
            }
        })
            .jpeg()
            .toBuffer();

        return jpegBuffer.toString('base64');
    } catch (err) {
        console.error('Napaka pri generiranju JPEG:', err);
        throw err;
    }
};

// 🎯 POST /api/images/uploadimg
// Glavna točka za prejem stisnjene slike s telefona
router.post('/uploadimg', async (req, res) => {
    const { obrokId, userEmail, compressedData, locX, locY, width, height } = req.body;

    // Preverjanje vhodnih podatkov
    if (!compressedData || !obrokId || !width || !height) {
        return res.status(400).json({ error: 'Manjkajoči podatki (obrokId, compressedData, dimenzije)' });
    }

    try {
        const binaryBuffer = Buffer.from(compressedData, 'base64');

        // 1. REKONSTRUKCIJA SLIKE ZA ANALIZO
        console.log('🔄 Dekompresija in priprava slike za OpenAI...');
        const b64Image = await getJpegBase64(binaryBuffer, width, height);

        // 2. ANALIZA S POMOČJO OPENAI GPT-4o
        console.log('🧠 Pošiljanje slike na OpenAI...');
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: 'Analiziraj hrano na sliki. Bodi natančen pri količini. Vrni izključno JSON: { "isFood": true, "calories": št, "protein": št, "foodName": "ime" }'
                        },
                        {
                            type: 'image_url',
                            image_url: { url: `data:image/jpeg;base64,${b64Image}` }
                        },
                    ],
                },
            ],
            response_format: { type: "json_object" }
        });

        const foodData = JSON.parse(completion.choices[0].message.content);

        if (!foodData.isFood) {
            return res.status(400).json({ error: 'Na sliki ni bila zaznana hrana.' });
        }

        // 3. SHRANJEVANJE BINARNIH PODATKOV (Image Collection)
        const novaSlika = new Image({
            obrokId,
            compressedData: binaryBuffer,
            width,
            height
        });
        const shranjenaSlika = await novaSlika.save();

        // 4. USTVARJANJE OBROKA (Obrok Collection)
        const novObrok = new Obrok({
            obrokId,
            userEmail,
            imageId: shranjenaSlika._id,
            locX: locX || null,
            locY: locY || null,
            name: foodData.foodName || 'Neznan obrok',
            calories: foodData.calories || 0,
            protein: foodData.protein || 0
        });

        await novObrok.save();

        // 5. OBVESTILO PREKO MQTT (Real-time update)
        const mqttMsg = {
            obrokId: novObrok.obrokId,
            userEmail: novObrok.userEmail,
            name: novObrok.name,
            calories: novObrok.calories,
            protein: novObrok.protein,
            locX: novObrok.locX,
            locY: novObrok.locY,
            timestamp: novObrok.timestamp,
            hasImage: true
        };

        if (mqttClient.connected) {
            mqttClient.publish(MQTT_TOPIC, JSON.stringify(mqttMsg), { qos: 1 });
            console.log('✅ MQTT sporočilo objavljeno.');
        }

        // 6. USPEŠEN ODGOVOR
        res.status(201).json({
            success: true,
            message: 'Obrok uspešno ustvarjen z DCT kompresijo',
            obrok: novObrok
        });

    } catch (err) {
        console.error('Napaka v uploadimg procesoru:', err);
        res.status(500).json({ error: 'Interna napaka pri obdelavi slike' });
    }
});

module.exports = router;