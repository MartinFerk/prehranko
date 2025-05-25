// screens/SettingsScreen.js
import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import AuthButton from '../components/AuthButton';
import { theme } from '../styles/theme';

export default function SettingsScreen({ navigation }) {
  const handleLogout = () => {
    Alert.alert(
      'Odjava',
      'Ali ste prepričani, da se želite odjaviti?',
      [
        { text: 'Prekliči', style: 'cancel' },
        {
          text: 'Odjavi se',
          style: 'destructive',
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nastavitve</Text>
      <Text style={styles.description}>Tukaj bodo nastavitve aplikacije.</Text>
      <AuthButton
        title="Odjava"
        onPress={handleLogout}
        color={theme.colors.accent} // Temno oranžna za odjavo
      />
      <View style={styles.buttonSpacing} />
      <AuthButton
        title="Nazaj"
        onPress={() => navigation.goBack()}
        color={theme.colors.secondary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.large,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.medium,
  },
  description: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: theme.spacing.large,
    textAlign: 'center',
  },
  buttonSpacing: {
    marginTop: theme.spacing.medium,
  },
});