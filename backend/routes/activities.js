const express = require('express');
const router = express.Router();
const mqtt = require('mqtt');

const MQTT_URL = 'ws://prehrankomosquitto-production.up.railway.app';
const TOPIC = 'prehranko/activities';

const mqttClient = mqtt.connect(MQTT_URL, {
    connectTimeout: 5000,
    clientId: `server_${Math.random().toString(16).slice(2, 8)}`,
    clean: true,
    reconnectPeriod: 1000,
});

mqttClient.on('connect', () => {
    console.log('📡 MQTT client (route) connected');
});

router.post('/', (req, res) => {
    const { activityId, userEmail, stats } = req.body;

    console.log('📥 Prejeta aktivnost (POST)', { activityId, userEmail });

    if (!activityId || !userEmail || !Array.isArray(stats)) {
        console.warn('⚠️ Napačen payload');
        return res.status(400).json({ message: 'Missing activity data' });
    }

    // ✅ Send response immediately
    res.status(202).json({ message: 'Activity accepted (MQTT async)' });

    // 📨 Publish to MQTT in background
    mqttClient.publish(
        TOPIC,
        JSON.stringify({ activityId, userEmail, stats }),
        {},
        (err) => {
            if (err) {
                console.warn('⚠️ MQTT publish error:', err.message);
            } else {
                console.log('📤 Aktivnost poslana na MQTT:', activityId);
            }
        }
    );
});

module.exports = router;
