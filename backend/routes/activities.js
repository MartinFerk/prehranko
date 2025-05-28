const express = require('express');
const router = express.Router();
const mqtt = require('mqtt');

const MQTT_URL = 'ws://prehrankomosquitto-production.up.railway.app:8080';
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

    if (!activityId || !userEmail || !Array.isArray(stats)) {
        return res.status(400).json({ message: 'Missing activity data' });
    }

    mqttClient.publish(
        TOPIC,
        JSON.stringify({ activityId, userEmail, stats }),
        {},
        (err) => {
            if (err) {
                console.warn('⚠️ MQTT publish error:', err.message);
                return res.status(500).json({ message: 'Failed to publish to MQTT' });
            }

            console.log('📤 Activity published to MQTT');
            res.status(202).json({ message: 'Activity forwarded to MQTT (listener will save it)' });
        }
    );
});

module.exports = router;
