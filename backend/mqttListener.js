const mqtt = require('mqtt');
const Activity = require('./models/Activity');

const MQTT_URL = 'ws://prehrankomosquitto-production.up.railway.app:8080';
const TOPIC = 'prehranko/activities';

const client = mqtt.connect(MQTT_URL, {
    connectTimeout: 5000,
    clientId: `backend_${Math.random().toString(16).slice(2, 8)}`,
    clean: true,
    reconnectPeriod: 1000,
});

// 🔌 Connection established
client.on('connect', () => {
    console.log('📡 MQTT povezava vzpostavljena');

    client.subscribe(TOPIC, (err) => {
        if (err) {
            console.error('❌ Napaka pri naročanju na temo:', err.message);
        } else {
            console.log(`✅ Naročen na temo: ${TOPIC}`);
        }
    });
});

// 📩 Handle incoming MQTT messages
client.on('message', async (topic, message) => {
    try {
        const payload = JSON.parse(message.toString());

        // 🛡️ Validate payload structure
        const { activityId, userEmail, stats } = payload;
        if (!activityId || !userEmail || !Array.isArray(stats)) {
            console.warn('⚠️ Neveljavni podatki:', payload);
            return;
        }

        const newActivity = new Activity(payload);
        await newActivity.save();
        console.log('✅ Aktivnost shranjena iz MQTT:', activityId);
    } catch (err) {
        console.error('❌ Napaka pri obdelavi MQTT sporočila:', err.message);
    }
});

// ⚠️ Handle errors
client.on('error', (err) => {
    console.error('❌ Napaka MQTT:', err.message);
});

client.on('reconnect', () => {
    console.log('🔁 Poskus ponovne povezave na MQTT strežnik...');
});
