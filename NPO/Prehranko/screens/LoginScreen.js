import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert } from 'react-native';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    console.log("➡️ Poskušam se prijaviti z:", email, password);
    try {
      const res = await fetch('https://prehranko-production.up.railway.app/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log("⬅️ Odgovor:", data);

      if (res.ok) {
        Alert.alert('2FA', 'Za nadaljevanje boš preusmerjen na preverjanje s kamero.');
        navigation.navigate('CameraScreen', { email: email }); // preusmeri na 2FA zaslon
      } else {
        Alert.alert('Napaka', data.message || 'Prijava ni uspela');
      }
    } catch (err) {
      Alert.alert('Napaka', 'Napaka pri povezavi s strežnikom');
      console.error("❌ Napaka:", err);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        placeholder="Geslo"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button title="Prijava" onPress={handleLogin} />
      <View style={{ marginTop: 10 }} />
      <Button
        title="Registriraj se"
        onPress={() => navigation.navigate('Register')}
        color="#888"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  input: {
    borderBottomWidth: 1,
    marginBottom: 15,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
});