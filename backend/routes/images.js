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
const fs = require('fs');
const path = require('path');

router.post('/uploadimg', async (req, res) => {
    const startTime = Date.now();
    const { obrokId, userEmail, compressedData, locX, locY, width, height } = req.body;

    console.log(`\n--- 🚀 Začetek procesa [ID: ${obrokId}] ---`);
    console.log(`📊 Podatki: ${width}x${height}, Velikost Base64: ${(compressedData.length / 1024).toFixed(2)} KB`);

    // Preverjanje vhodnih podatkov
    if (!compressedData || !obrokId || !width || !height) {
        console.error('❌ Manjkajoči podatki v zahtevi.');
        return res.status(400).json({ error: 'Manjkajoči podatki (obrokId, compressedData, dimenzije)' });
    }

    try {
        // 1. REKONSTRUKCIJA SLIKE
        console.time('⏱️ Dekompresija (getJpegBase64)');
        const binaryBuffer = Buffer.from(compressedData, 'base64');
        const b64Image = await getJpegBase64(binaryBuffer, width, height);
        console.timeEnd('⏱️ Dekompresija (getJpegBase64)');

        // --- DEBUG: Shranjevanje slike na disk ---
        try {
            const debugPath = path.join(__dirname, '..', `debug_${obrokId}.jpg`);
            fs.writeFileSync(debugPath, Buffer.from(b64Image, 'base64'));
            console.log(`📸 Debug slika shranjena: ${debugPath}`);
        } catch (fsErr) {
            console.error('⚠️ Napaka pri shranjevanju debug slike:', fsErr.message);
        }

        // 2. ANALIZA S POMOČJO OPENAI GPT-4o
        console.log('🧠 Pošiljanje slike na OpenAI...');
        console.time('⏱️ OpenAI API klic');

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: 'Analiziraj sliko. Če je na njej hrana, bodi natančen. Če hrane ni, v foodName opiši kaj vidiš. Vrni JSON: { "isFood": boolean, "calories": št, "protein": št, "foodName": "ime" }'
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:image/jpeg;base64,${b64Image}`,
                                detail: "low" // Optimizacija za 512x512
                            }
                        },
                    ],
                },
            ],
            response_format: { type: "json_object" }
        });
        console.timeEnd('⏱️ OpenAI API klic');

        const foodData = JSON.parse(completion.choices[0].message.content);
        console.log('📝 Odgovor OpenAI:', foodData);

        if (!foodData.isFood) {
            console.warn(`🚫 Hrana ni bila zaznana. AI vidi: ${foodData.foodName}`);
            return res.status(400).json({
                error: 'Na sliki ni bila zaznana hrana.',
                aiDescription: foodData.foodName
            });
        }

        // 3. SHRANJEVANJE V BAZO (Image)
        console.log('💾 Shranjevanje slike v DB...');
        const novaSlika = new Image({
            obrokId,
            compressedData: binaryBuffer,
            width,
            height
        });
        const shranjenaSlika = await novaSlika.save();

        // 4. USTVARJANJE OBROKA
        console.log('💾 Ustvarjanje zapisa obroka...');
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

        // 5. MQTT OBVESTILO
        if (mqttClient.connected) {
            const mqttMsg = {
                obrokId: novObrok.obrokId,
                userEmail: novObrok.userEmail,
                name: novObrok.name,
                calories: novObrok.calories,
                protein: novObrok.protein,
                timestamp: novObrok.timestamp
            };
            mqttClient.publish(process.env.MQTT_TOPIC, JSON.stringify(mqttMsg), { qos: 1 });
            console.log('📡 MQTT sporočilo poslano.');
        } else {
            console.log('⚠️ MQTT ni povezan, sporočilo ni bilo poslano.');
        }

        const totalTime = (Date.now() - startTime) / 1000;
        console.log(`✅ Uspešno zaključeno v ${totalTime}s\n`);

        res.status(201).json({
            success: true,
            obrok: novObrok
        });

    } catch (err) {
        console.error('❌ KRITIČNA NAPAKA:', err);
        res.status(500).json({ error: 'Interna napaka pri obdelavi' });
    }
});
module.exports = router;