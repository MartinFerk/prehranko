// screens/LoginScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, Alert, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthInput from '../components/TextInput';
import AuthButton from '../components/AuthButton';
import { loginUser } from '../services/auth';
import { theme } from '../styles/theme';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const [clientId, setClientId] = useState('');

  // Inicializacija deviceId in clientId
  useEffect(() => {
    const initializeDeviceInfo = async () => {
      // Preveri ali pridobi deviceId iz AsyncStorage
      let storedDeviceId = await AsyncStorage.getItem('deviceId');
      if (!storedDeviceId) {
        storedDeviceId = uuidv4();
        await AsyncStorage.setItem('deviceId', storedDeviceId);
      }
      setDeviceId(storedDeviceId);

      // Generiraj clientId
      const newClientId = `mobile_${Math.random().toString(16).slice(2, 8)}`;
      setClientId(newClientId);
    };

    initializeDeviceInfo();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Napaka', 'Prosimo, izpolnite vsa polja.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Napaka', 'Vnesite veljaven email naslov.');
      return;
    }

    if (!deviceId || !clientId) {
      Alert.alert('Napaka', 'Podatki o napravi niso na voljo.');
      return;
    }

    setLoading(true);

    try {
      console.log('➡️ Poskušam se prijaviti z:', { email, password, deviceId, deviceName: Device.deviceName || 'Unknown Device', clientId });

      const result = await loginUser(email, password, deviceId, Device.deviceName || 'Unknown Device', clientId);
      if (result.user?.username) {
  await AsyncStorage.setItem('username', result.user.username);
  navigation.navigate('Home', {
    email: result.user.email,
    userId: result.user._id,
    username: result.user.username,
  });
} else {
  console.warn("⚠️ Uporabniško ime ni bilo vrnjeno s strežnika.");
}
      
      console.log('⬅️ Odgovor:', result);
      console.log('🐞 DEBUG rezultat:', JSON.stringify(result, null, 2));

      Alert.alert('Uspeh', 'Prijava uspešna!');

      

    } catch (err) {
      Alert.alert('Napaka', err.message || 'Napaka pri povezavi s strežnikom');
      console.error('❌ Napaka:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Prijava v Prehranko</Text>
      <View style={styles.inputContainer}>
        <AuthInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboard saus="email-address"
        />
        <AuthInput
          placeholder="Geslo"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} />
        ) : (
          <AuthButton title="Prijava" onPress={handleLogin} />
        )}
        <View style={styles.buttonSpacing} />
        <AuthButton
          title="Registriraj se"
          onPress={() => navigation.navigate('Register')}
          color={theme.colors.primary}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.large,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.large,
  },
  inputContainer: {
    width: '65%',
    alignSelf: 'center',
  },
  buttonSpacing: {
    marginTop: theme.spacing.medium,
  },
});