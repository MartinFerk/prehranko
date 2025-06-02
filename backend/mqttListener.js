// mqttListener.js
const mongoose = require('mongoose');
const mqtt = require('mqtt');
const Activity = require('./models/Activity');
const User = require('./models/User');

const MQTT_URL = 'mqtt://prehrankomosquitto.railway.internal:1883';
const TOPIC = 'prehranko/activities';

console.log('🚀 Starting MQTT Listener...');
console.log('📡 Connecting to internal broker at:', MQTT_URL);

const client = mqtt.connect(MQTT_URL, {
  connectTimeout: 5000,
  clientId: `backend_${Math.random().toString(16).slice(2, 8)}`,
  clean: true,
  reconnectPeriod: 1000,
});

client.on('connect', async () => {
  console.log('✅ MQTT connection established');
  console.log(`🔔 Subscribing to topic: ${TOPIC}`);

  client.subscribe(TOPIC, (err) => {
    if (err) {
      console.error('❌ Subscription error:', err.message);
    } else {
      console.log(`📬 Subscribed to ${TOPIC} successfully`);
    }
  });

  // Periodični izpis števila aktivnih naprav (vsakih 30 sekund)
  setInterval(async () => {
    try {
      const activeDevices = await User.aggregate([
        { $unwind: '$devices' },
        { $match: { 'devices.isConnected': true } },
        { $count: 'activeDevices' },
      ]);
      const count = activeDevices[0]?.activeDevices || 0;
      console.log(`📊 Active devices: ${count}`);
    } catch (err) {
      console.error('❌ Error counting active devices:', err.message);
    }
  }, 30000);
});

// 📩 Handle incoming MQTT messages (ohranjamo obstoječo logiko)
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

// 🔁 Handle client disconnections
client.on('close', async () => {
  console.log('🔌 MQTT connection closed');
  // Posodobi status vseh naprav na nepovezane
  try {
    await User.updateMany(
      { 'devices.isConnected': true },
      { $set: { 'devices.$[].isConnected': false } }
    );
    console.log('✅ Updated all devices to disconnected');
  } catch (err) {
    console.error('❌ Error updating device status:', err.message);
  }
});

client.on('error', (err) => {
  console.error('❌ MQTT connection error:', err.message);
});