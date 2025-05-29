// App.js
import 'react-native-get-random-values';
import React, { useEffect } from 'react';
import AppNavigator from './navigation/AppNavigator';

const POLL_INTERVAL = 5000;

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
