import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert } from 'react-native';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    try {
      const res = await fetch('https://prehranko-production.up.railway.app/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        Alert.alert('Uspeh', data.message || 'Registracija uspešna!');
        navigation.navigate('Login');
      } else {
        Alert.alert('Napaka', data.message || 'Registracija ni uspela');
      }
    } catch (err) {
      Alert.alert('Napaka', 'Napaka pri povezavi s strežnikom');
      console.error(err);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} />
      <TextInput placeholder="Geslo" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
      <Button title="Registracija" onPress={handleRegister} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  input: { borderBottomWidth: 1, marginBottom: 15 },
});
