// screens/HomeScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AuthButton from '../components/AuthButton';
import { theme } from '../styles/theme';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Prehranko!</Text>
      <AuthButton title="Odjava" onPress={() => navigation.navigate('Login')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 24,
    marginBottom: theme.spacing.large,
  },
});