// screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import AuthInput from '../components/TextInput';
import AuthButton from '../components/AuthButton';
import { loginUser } from '../services/auth';
import { theme } from '../styles/theme';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    console.log("➡️ Poskušam se prijaviti z:", email, password);
    try {
      const data = await loginUser(email, password);
      Alert.alert('2FA', 'Za nadaljevanje boš preusmerjen na preverjanje s kamero.');
      navigation.navigate('CameraScreen', { email });
    } catch (err) {
      Alert.alert('Napaka', err.message || 'Napaka pri povezavi s strežnikom');
      console.error("❌ Napaka:", err);
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
      <AuthButton title="Prijava" onPress={handleLogin} />
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