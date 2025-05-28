const express = require('express');
const router = express.Router();
const mqtt = require('mqtt');

const MQTT_URL = 'ws://prehrankomosquitto-production.up.railway.app:80';
const TOPIC = 'prehranko/activities';

console.log('🚀 Initializing MQTT client for /api/activities route...');
console.log('📡 Connecting to:', MQTT_URL);

const mqttClient = mqtt.connect(MQTT_URL, {
    connectTimeout: 5000,
    clientId: `server_${Math.random().toString(16).slice(2, 8)}`,
    clean: true,
    reconnectPeriod: 1000,
});

mqttClient.on('connect', () => {
    console.log('✅ MQTT client (route) connected successfully');
});

mqttClient.on('error', (err) => {
    console.error('❌ MQTT client error (route):', err.message);
});

mqttClient.on('reconnect', () => {
    console.log('🔁 Reconnecting MQTT client (route)...');
});

mqttClient.on('close', () => {
    console.log('🔌 MQTT client (route) connection closed');
});

mqttClient.on('offline', () => {
    console.log('⚠️ MQTT client (route) is offline');
});

router.post('/', (req, res) => {
    const { activityId, userEmail, stats } = req.body;

    console.log('📥 Received POST /api/activities');
    console.log('🔍 Payload:', JSON.stringify(req.body, null, 2));

    if (!activityId || !userEmail || !Array.isArray(stats)) {
        console.warn('⚠️ Invalid payload format — missing required fields');
        return res.status(400).json({ message: 'Missing activity data' });
    }

    // Respond to client immediately
    res.status(202).json({ message: 'Activity accepted (MQTT async)' });

    // Publish to MQTT broker
    mqttClient.publish(
        TOPIC,
        JSON.stringify({ activityId, userEmail, stats }),
        {},
        (err) => {
            if (err) {
                console.warn('❌ MQTT publish failed:', err.message);
            } else {
                console.log('📤 Activity published to MQTT successfully:', activityId);
            }
        }
    );
});

module.exports = router;
