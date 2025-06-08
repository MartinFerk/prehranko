// App.js
import 'react-native-get-random-values';
import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import MQTT from 'react-native-mqtt'; // Predpostavimo, da je nameščena
import AppNavigator from './navigation/AppNavigator';

const POLL_INTERVAL = 5000;
const API_BASE_URL = 'https://prehranko-production.up.railway.app'; // Prilagojeno
const MQTT_URL = 'mqtt://prehrankomosquitto.railway.internal:1883';

export default function App() {
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`${API_BASE_URL}/check2fa?email=${userEmail}`);
      const data = await res.json();

      if (data.pending2FA) {
        // 🔔 Navigacija na zaslon za preverjanje obraza
        navigation.navigate("FaceVerificationScreen");
      }
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return <AppNavigator />;
}