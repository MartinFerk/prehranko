const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const mqtt = require('mqtt');

const MQTT_URL = 'ws://prehrankomosquitto-production.up.railway.app:8080';
const TOPIC = 'prehranko/activities';

// Optional: connect once globally
const mqttClient = mqtt.connect(MQTT_URL, {
    connectTimeout: 5000,
    clientId: `server_${Math.random().toString(16).slice(2, 8)}`,
    clean: true,
    reconnectPeriod: 1000,
});

mqttClient.on('connect', () => {
    console.log('📡 MQTT client (POST) povezan');
});

router.post('/', async (req, res) => {
    const { activityId, userEmail, stats } = req.body;

    if (!activityId || !userEmail || !Array.isArray(stats)) {
        return res.status(400).json({ message: 'Manjkajoči podatki' });
    }

    try {
        const newActivity = new Activity({ activityId, userEmail, stats });
        await newActivity.save();

        // 🟢 Publish to MQTT
        mqttClient.publish(
            TOPIC,
            JSON.stringify({ activityId, userEmail, stats }),
            {},
            (err) => {
                if (err) {
                    console.warn('⚠️ MQTT publish napaka:', err.message);
                } else {
                    console.log('📤 Aktivnost poslana na MQTT');
                }
            }
        );

        res.status(201).json({ message: 'Aktivnost shranjena in poslana' });
    } catch (err) {
        console.error('❌ Napaka pri shranjevanju aktivnosti:', err);
        res.status(500).json({ message: 'Napaka na strežniku' });
    }
});

module.exports = router;
