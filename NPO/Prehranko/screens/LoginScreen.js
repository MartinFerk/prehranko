import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (email === 'test@test.com' && password === '123456') {
      alert('Uspešna prijava!');
    } else {
      alert('Napačni podatki');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} />
      <TextInput placeholder="Geslo" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
      <Button title="Prijava" onPress={handleLogin} />
      <Text onPress={() => navigation.navigate('Register')} style={styles.link}>
        Nimaš računa? Registriraj se →
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  input: { borderBottomWidth: 1, marginBottom: 15 },
  link: { marginTop: 20, color: 'blue', textAlign: 'center' },
});
