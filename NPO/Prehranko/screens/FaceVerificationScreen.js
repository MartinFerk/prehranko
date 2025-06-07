// FaceVerificationScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, Button, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '../services/api';

const FaceVerificationScreen = ({ route }) => {
  const { email } = route.params;
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const check2FAStatus = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/status?email=${encodeURIComponent(email)}`);
        const data = await res.json();

        if (data.pending2FA) {
          setPending(true);
        } else {
          setPending(false);
          console.log('ℹ️ Ni aktivne 2FA zahteve, vračam nazaj.');
          navigation.goBack();
        }
      } catch (err) {
        console.error('❌ Napaka pri preverjanju 2FA:', err.message);
      } finally {
        setLoading(false);
      }
    };

    check2FAStatus();
  }, [email]);

  const complete2FA = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/complete-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Napaka pri dokončanju 2FA');
      console.log('✅ 2FA uspešno dokončan');
    } catch (err) {
      console.error('❌ Napaka pri dokončanju 2FA:', err.message);
    }
  };

  const handleVerificationComplete = () => {
    complete2FA();
    navigation.goBack();
  };

  return (
    <View style={{ padding: 20 }}>
      {loading ? (
        <>
          <Text>⌛ Preverjam 2FA status...</Text>
          <ActivityIndicator size="large" color="#0000ff" />
        </>
      ) : pending ? (
        <>
          <Text style={{ fontSize: 18, marginBottom: 10 }}>🛡 Potrebna je 2FA verifikacija!</Text>
          <Button
            title="Začni preverjanje obraza"
            onPress={() => navigation.navigate('CameraScreen', { email, onComplete: handleVerificationComplete })}
          />
        </>
      ) : (
        <Text>❌ Ni aktivne 2FA zahteve.</Text>
      )}
    </View>
  );
};

export default FaceVerificationScreen;