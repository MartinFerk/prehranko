import React, { useEffect, useState } from 'react';
import { View, Text, Button, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // ⬅️ dodaj to

const FaceVerificationScreen = ({ route }) => {
  const { email } = route.params;
  const [pending, setPending] = useState(false);
  const navigation = useNavigation(); // ⬅️ hook za navigacijo

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`https://prehranko-production.up.railway.app/api/auth/status?email=${email}`);
        const data = await res.json();

        if (data.pending2FA) {
          clearInterval(interval);
          setPending(true);
        }
      } catch (err) {
        console.error('Napaka pri preverjanju 2FA:', err.message);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={{ padding: 20 }}>
      {pending ? (
        <>
          <Text style={{ fontSize: 18, marginBottom: 10 }}>🛡 Potrebna je 2FA verifikacija!</Text>
          <Button
            title="Začni preverjanje obraza"
            onPress={() => navigation.navigate('CameraScreen', { email })}
          />
        </>
      ) : (
        <>
          <Text>⌛ Čakam na 2FA zahtevo...</Text>
          <ActivityIndicator size="large" color="#0000ff" />
        </>
      )}
    </View>
  );
};

export default FaceVerificationScreen;
