// screens/RegisterScreen.js
import React, { useState } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import AuthInput from '../components/TextInput';
import AuthButton from '../components/AuthButton';
import { registerUser } from '../services/auth';
import { theme } from '../styles/theme';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    try {
      await registerUser(email, password);
      Alert.alert('Uspeh', 'Registracija uspešna!');
      navigation.navigate('Login');
    } catch (err) {
      Alert.alert('Napaka', err.message || 'Napaka pri povezavi s strežnikom');
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
      <AuthButton title="Registracija" onPress={handleRegister} />
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
});