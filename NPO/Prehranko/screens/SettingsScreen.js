// SettingsScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthButton from '../components/AuthButton';
import { logoutUser } from '../services/auth';
import { theme } from '../styles/theme';

export default function SettingsScreen({ navigation, route }) {
  const { email } = route.params || { email: 'Uporabnik' };
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const deviceId = await AsyncStorage.getItem('deviceId');
      if (!deviceId) {
        throw new Error('Device ID ni na voljo');
      }

      console.log('➡️ Poskušam se odjaviti z:', { email, deviceId });
      const result = await logoutUser(email, deviceId);
      console.log('⬅️ Odgovor odjave:', result);

      Alert.alert('Uspeh', 'Odjava uspešna!');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (err) {
      Alert.alert('Napaka', err.message || 'Napaka pri odjavi');
      console.error('❌ Napaka pri odjavi:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigation.navigate('Home', { email });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nastavitve</Text>
      <View style={styles.buttonContainer}>
        <Text style={styles.emailText}>Prijavljen: {email}</Text>
        <AuthButton
          title={loading ? 'Odjavljanje...' : 'Odjava'}
          onPress={handleLogout}
          color={theme.colors.primary}
          disabled={loading}
        />
        <View style={styles.buttonSpacing} />
        <AuthButton
          title="Nazaj"
          onPress={handleGoBack}
          color={theme.colors.secondary}
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
  buttonContainer: {
    width: '65%',
    alignSelf: 'center',
  },
  emailText: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.medium,
  },
  buttonSpacing: {
    marginTop: theme.spacing.medium,
  },
});