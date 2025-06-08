// mqttListener.js
const mongoose = require('mongoose');
const mqtt = require('mqtt');
const Activity = require('./models/Activity');
const User = require('./models/User');

const MQTT_URL = 'mqtt://prehrankomosquitto.railway.internal:1883';
const TOPIC = 'prehranko/activities';
const OBROKI_TOPIC = 'prehranko/obroki';

console.log('🚀 Starting MQTT Listener...');
console.log('📡 Connecting to internal broker at:', MQTT_URL);

const client = mqtt.connect(MQTT_URL, {
  connectTimeout: 30000, // Povečamo na 30 sekund
  clientId: `backend_${Math.random().toString(16).slice(2, 8)}`,
  clean: true,
  reconnectPeriod: 5000, // Poskus ponovne povezave vsakih 5 sekund
  keepalive: 60, // Keepalive interval
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

  client.subscribe(OBROKI_TOPIC, (err) => {
  if (!err) {
    console.log(`🛎️ Subscribed to ${OBROKI_TOPIC}`);
  }
  });

  client.on('message', (topic, message) => {
  if (topic === OBROKI_TOPIC) {
    console.log('📥 Prejet obrok (MQTT):', message.toString());
    // Lahko shraniš ali dodatno obdelaš podatke tukaj
  }
  });
  // Periodični izpis števila aktivnih naprav
  setInterval(async () => {
    console.log('🔍 Checking MQTT connection status:', client.connected);
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

let zadnjiObrok = null;

mqttClient.on('message', (topic, message) => {
  const msg = message.toString();
  console.log("📥 Prejet obrok (MQTT):", msg);
  zadnjiObrok = msg; // shrani zadnji obrok
});

  module.exports = {
    getZadnjiObrok: () => zadnjiObrok
  };


client.on('reconnect', () => {
  console.log('🔁 Attempting to reconnect to MQTT broker...');
});

client.on('close', async () => {
  console.log('🔌 MQTT connection closed');
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

client.on('offline', () => {
  console.log('⚠️ MQTT client went offline');
});

// Testna povezava z MongoDB ob zagonu
mongoose.connection.on('connected', () => {
  console.log('✅ Connected to MongoDB');
});
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
});