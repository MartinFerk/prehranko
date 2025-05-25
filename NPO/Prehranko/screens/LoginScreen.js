// screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import AuthInput from '../components/TextInput';
import AuthButton from '../components/AuthButton';
import { loginUser } from '../services/auth';
import { theme } from '../styles/theme';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Napaka', 'Prosimo, izpolnite vsa polja.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Napaka', 'Vnesite veljaven email naslov.');
      return;
    }
    setLoading(true);
    try {
      console.log('➡️ Poskušam se prijaviti z:', email, password);
      await loginUser(email, password);
      Alert.alert('Uspeh', 'Prijava uspešna!');
      navigation.navigate('Home', { email }); // Preusmeri na HomeScreen
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
      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} />
      ) : (
        <AuthButton title="Prijava" onPress={handleLogin} />
      )}
      <View style={styles.buttonSpacing} />
      <AuthButton
        title="Registriraj se"
        onPress={() => navigation.navigate('Register')}
        color={theme.colors.secondary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.large,
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  buttonSpacing: {
    marginTop: theme.spacing.medium,
  },
});