import React, { useEffect, useState } from 'react';
import { View, Text, Button, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { check2FAStatus, complete2FA } from '../services/auth';

const FaceVerificationScreen = ({ route }) => {
  const { email } = route.params;
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useFocusEffect(
    React.useCallback(() => {
      const fetchStatus = async () => {
        try {
          const data = await check2FAStatus(email);
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
      fetchStatus();
    }, [email])
  );

  const handleVerification = async () => {
    navigation.navigate('CameraScreen', { email, mode: 'verify' });
  };

  const handleVerificationComplete = async () => {
    const success = await complete2FA(email);
    if (success) {
      await AsyncStorage.setItem('2faVerified', 'true');
      navigation.goBack();
    } else {
      console.error('❌ Neuspešno dokončanje 2FA');
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      check2FAStatus(email).then(data => {
        if (!data.pending2FA) {
          handleVerificationComplete();
        }
      });
    });
    return unsubscribe;
  }, [navigation, email]);

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
          <Button title="Začni preverjanje obraza" onPress={handleVerification} />
        </>
      ) : (
        <Text>❌ Ni aktivne 2FA zahteve.</Text>
      )}
    </View>
  );
};

export default FaceVerificationScreen;