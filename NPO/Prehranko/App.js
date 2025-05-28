// App.js
import 'react-native-get-random-values'; // for UUIDs or crypto if needed
import React from 'react';
import AppNavigator from './navigation/AppNavigator';
import { useEffect } from 'react';

const POLL_INTERVAL = 5000;

useEffect(() => {
  const interval = setInterval(async () => {
    const res = await fetch(`${API_BASE_URL}/check2fa?email=${userEmail}`);
    const data = await res.json();

    if (data.pending2FA) {
      // 🔔 Pokliči zaslon za zajem slike ali pošlji lokalno obvestilo
      navigation.navigate("FaceVerificationScreen");
    }
  }, POLL_INTERVAL);

  return () => clearInterval(interval);
}, []);


export default function App() {
  return <AppNavigator />;
}
