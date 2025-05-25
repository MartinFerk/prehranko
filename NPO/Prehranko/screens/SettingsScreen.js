// screens/RegisterScreen.js
import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient'; // Uvoz LinearGradient
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
    <LinearGradient
      colors={[theme.colors.background, theme.colors.secondary]} // Enak gradient kot pri LoginScreen
      style={styles.container}
    >
      <Text style={styles.title}>Registracija v Prehranko</Text>
      <View style={styles.inputContainer}>
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.large,
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