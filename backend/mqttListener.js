// mqttListener.js
const mongoose = require('mongoose');
const mqtt = require('mqtt');
const Activity = require('./models/Activity');
const User = require('./models/User');

const MQTT_URL = 'mqtt://prehrankomosquitto.railway.internal:1883';
const ACTIVITY_TOPIC = 'prehranko/activities';
const TWO_FA_TOPIC = '2fa/request/+'; // Nova tema za 2FA zahteve

console.log('🚀 Starting MQTT Listener...');
console.log('📡 Connecting to internal broker at:', MQTT_URL);

const client = mqtt.connect(MQTT_URL, {
  connectTimeout: 30000,
  clientId: `backend_${Math.random().toString(16).slice(2, 8)}`,
  clean: true,
  reconnectPeriod: 5000,
  keepalive: 60,
});

client.on('connect', async () => {
  console.log('✅ MQTT connection established');
  console.log(`🔔 Subscribing to topics: ${ACTIVITY_TOPIC}, ${TWO_FA_TOPIC}`);

  // Naroči se na obe temi
  client.subscribe([ACTIVITY_TOPIC, TWO_FA_TOPIC], (err) => {
    if (err) {
      console.error('❌ Subscription error:', err.message);
    } else {
      console.log(`📬 Subscribed to ${ACTIVITY_TOPIC} and ${TWO_FA_TOPIC} successfully`);
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

client.on('message', async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    console.log(`📨 Received message on topic ${topic}:`, data);

    if (topic.startsWith('2fa/request/')) {
      // Obdelaj 2FA zahtevo
      const email = topic.split('/').pop(); // Izvleci email iz teme (npr. 2fa/request/test@example.com)
      const user = await User.findOne({ email });

      if (!user) {
        console.error(`❌ User not found for email: ${email}`);
        return;
      }

      // Posodobi status pending2FA
      user.pending2FA = true;
      await user.save();
      console.log(`✅ Set pending2FA to true for ${email}`);
    } else if (topic === ACTIVITY_TOPIC) {
      // Obdelaj aktivnosti (obstoječa logika)
      const activity = new Activity(data);
      await activity.save();
      console.log(`✅ Saved activity: ${data.type}`);
    }
  } catch (err) {
    console.error('❌ Error processing MQTT message:', err.message);
  }
});

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

// Funkcija za pošiljanje MQTT sporočila za 2FA
const publish2FARequest = (email) => {
  const topic = `2fa/request/${email}`;
  const message = JSON.stringify({ email, pending2FA: true });

  client.publish(topic, message, { qos: 1 }, (err) => {
    if (err) {
      console.error(`❌ Error publishing 2FA request for ${email}:`, err.message);
    } else {
      console.log(`📬 Published 2FA request to ${topic}`);
    }
  });
};

module.exports = { client, publish2FARequest };