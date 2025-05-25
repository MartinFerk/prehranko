// screens/RegisterScreen.js
import React, { useState } from 'react';
import { View, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import AuthInput from '../components/TextInput';
import AuthButton from '../components/AuthButton';
import { registerUser } from '../services/auth';
import { theme } from '../styles/theme';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Napaka', 'Prosimo, izpolnite vsa polja.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Napaka', 'Vnesite veljaven email naslov.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Napaka', 'Gesli se ne ujemata.');
      return;
    }
    setLoading(true);
    try {
      console.log('➡️ Poskušam se registrirati z:', email, password);
      await registerUser(email, password);
      Alert.alert('Uspeh', 'Registracija uspešna! Prijava je na voljo.');
      navigation.navigate('Login');
    } catch (err) {
      Alert.alert('Napaka', err.message || 'Napaka pri povezavi s strežnikom');
      console.error('❌ Napaka:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AuthInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <AuthInput
        placeholder="Geslo"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <AuthInput
        placeholder="Potrdi geslo"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} />
      ) : (
        <AuthButton title="Registriraj se" onPress={handleRegister} />
      )}
      <View style={styles.buttonSpacing} />
      <AuthButton
        title="Nazaj na prijavo"
        onPress={() => navigation.navigate('Login')}
        color={theme.colors.secondary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.large,
    backgroundColor: theme.colors.background, // Svetlo bež ozadje
  },
  buttonSpacing: {
    marginTop: theme.spacing.medium,
  },
});