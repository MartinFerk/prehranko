const express = require('express');
const router = express.Router();
const mqtt = require('mqtt');

// ✅ Use Railway's internal service DNS and raw TCP MQTT protocol
const MQTT_URL = 'mqtt://prehrankomosquitto.railway.internal:1883';
const TOPIC = 'prehranko/activities';

console.log('🚀 Initializing MQTT client for /api/activities route...');
console.log('📡 Connecting to internal MQTT broker at:', MQTT_URL);

// ✅ Connect to MQTT broker
const mqttClient = mqtt.connect(MQTT_URL, {
    connectTimeout: 5000,
    clientId: `server_${Math.random().toString(16).slice(2, 8)}`,
    clean: true,
    reconnectPeriod: 1000,
});

// ✅ MQTT connection status handlers
mqttClient.on('connect', () => {
    console.log('✅ MQTT client connected (route)');
});

mqttClient.on('error', (err) => {
    console.error('❌ MQTT client error (route):', err.message);
});

mqttClient.on('reconnect', () => {
    console.log('🔁 Reconnecting MQTT client (route)...');
});

mqttClient.on('close', () => {
    console.log('🔌 MQTT client connection closed (route)');
});

mqttClient.on('offline', () => {
    console.log('⚠️ MQTT client is offline (route)');
});

// ✅ POST endpoint to receive activity data
router.post('/', (req, res) => {
    const { activityId, userEmail, stats } = req.body;

    console.log('📥 Received POST /api/activities');
    console.log('🔍 Payload:', JSON.stringify(req.body, null, 2));

    // 🔒 Validate payload
    if (!activityId || !userEmail || !Array.isArray(stats)) {
        console.warn('⚠️ Invalid payload format — missing required fields');
        return res.status(400).json({ message: 'Missing or invalid activity data' });
    }

    // ✅ Respond early
    res.status(202).json({ message: 'Activity accepted (MQTT async)' });

    // 🚀 Publish activity to MQTT broker
    mqttClient.publish(
        TOPIC,
        JSON.stringify({ activityId, userEmail, stats }),
        {},
        (err) => {
            if (err) {
                console.warn('❌ MQTT publish failed:', err.message);
            } else {
                console.log('📤 Activity published to MQTT:', activityId);
            }
        }
    );
});

module.exports = router;
