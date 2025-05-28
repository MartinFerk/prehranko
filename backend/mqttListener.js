const mqtt = require('mqtt');
const Activity = require('./models/Activity');

const MQTT_URL = 'ws://prehrankomosquitto-production.up.railway.app';
const TOPIC = 'prehranko/activities';

console.log('🚀 Starting MQTT Listener...');
console.log('📡 Connecting to:', MQTT_URL);

const client = mqtt.connect(MQTT_URL, {
    protocol: 'ws', // Explicit WebSocket protocol
    connectTimeout: 5000,
    clientId: `backend_${Math.random().toString(16).slice(2, 8)}`,
    clean: true,
    reconnectPeriod: 1000,
});

client.on('connect', () => {
    console.log('✅ MQTT connection established');
    console.log(`🔔 Subscribing to topic: ${TOPIC}`);

    client.subscribe(TOPIC, (err) => {
        if (err) {
            console.error('❌ Subscription error:', err.message);
        } else {
            console.log(`📬 Subscribed to ${TOPIC} successfully`);
        }
    });
});

// ✅ Log raw MQTT stream errors if handshake fails
if (client.stream) {
    client.stream.on('error', (err) => {
        console.error('🔍 Stream error (possibly during handshake):', err.message);
    });
}

// 📩 Handle incoming MQTT messages
client.on('message', async (topic, message) => {
    console.log(`📩 Received message on topic ${topic}`);
    console.log('📦 Raw payload:', message.toString());

    try {
        const payload = JSON.parse(message.toString());

        const { activityId, userEmail, stats } = payload;
        if (!activityId || !userEmail || !Array.isArray(stats)) {
            console.warn('⚠️ Invalid payload structure:', payload);
            return;
        }

        console.log('📝 Valid activity received, saving to DB...');
        const newActivity = new Activity(payload);
        await newActivity.save();
        console.log('✅ Activity saved to MongoDB:', activityId);
    } catch (err) {
        console.error('❌ Error handling message:', err.message);
    }
});

// 🔁 Reconnection and status logs
client.on('reconnect', () => {
    console.log('🔁 Reconnecting to MQTT...');
});

client.on('close', () => {
    console.log('🔌 MQTT connection closed');
});

client.on('offline', () => {
    console.log('⚠️ MQTT client went offline');
});

client.on('end', () => {
    console.log('🔚 MQTT client ended connection');
});

client.on('error', (err) => {
    console.error('❌ MQTT connection error:', err.message);
});
