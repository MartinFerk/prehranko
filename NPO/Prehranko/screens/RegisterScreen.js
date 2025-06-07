// screens/RegisterScreen.js
import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import AuthInput from '../components/TextInput';
import AuthButton from '../components/AuthButton';
import { registerUser } from '../services/auth';
import { theme } from '../styles/theme';

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [photoTaken, setPhotoTaken] = useState(false);

  const handleRegister = async () => {
  if (!username || !email || !password || !confirmPassword) {
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
    console.log('➡️ Registriram z:',username, email, password);
    await registerUser(username,email, password);
    Alert.alert('✅ Registracija uspešna', 'Zdaj se prosim še slikaj za 2FA.');

    navigation.navigate('CameraScreen', {
      email, // pošlje email na CameraScreen
      onPhotoTaken: () => {
        setPhotoTaken(true);
        navigation.navigate('Login');
      },
    });
  } catch (err) {
    Alert.alert('Napaka', err.message || 'Napaka pri registraciji.');
    console.error('❌ Napaka:', err);
  } finally {
    setLoading(false);
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registracija v Prehranko</Text>
      <View style={styles.inputContainer}>
        <AuthInput
          placeholder="Username"
          value={email}
          onChangeText={setUsername}
        />
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
    width: '65%', // 65% širine zaslona
    alignSelf: 'center',
  },
  buttonSpacing: {
    marginTop: theme.spacing.medium,
  },
});