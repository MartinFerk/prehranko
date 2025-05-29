import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AuthButton from '../components/AuthButton';
import { theme } from '../styles/theme';

export default function SettingsScreen({ navigation, route }) {
  const { email } = route.params || { email: 'Uporabnik' }; // Privzeta vrednost, če email ni posredovan

  const handleLogout = () => {
    // Preusmeri na LoginScreen
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const handleGoBack = () => {
    // Vrni se na HomeScreen in posreduj email
    navigation.navigate('Home', { email });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nastavitve</Text>
      <View style={styles.buttonContainer}>
        <Text style={styles.emailText}>Prijavljen: {email}</Text>
        <AuthButton title="Odjava" onPress={handleLogout} color={theme.colors.primary} />
        <View style={styles.buttonSpacing} />
        <AuthButton
          title="Nazaj"
          onPress={handleGoBack}
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
    backgroundColor: theme.colors.background, // Enobarvno ozadje
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.large,
  },
  buttonContainer: {
    width: '65%',
    alignSelf: 'center',
  },
  emailText: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.medium,
  },
  buttonSpacing: {
    marginTop: theme.spacing.medium, // Razmik med gumboma
  },
});