import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import AuthInput from '../components/TextInput';
import AuthButton from '../components/AuthButton';
import { theme } from '../styles/theme';

export default function GoalScreen({ navigation, route }) {
  const { email } = route.params || {};
  const [caloricGoal, setCaloricGoal] = useState('');

  const handleSetGoal = async () => {
    if (!caloricGoal || isNaN(caloricGoal) || caloricGoal <= 0) {
      Alert.alert('Napaka', 'Vnesite veljaven kalorični cilj (pozitivno število).');
      return;
    }

    try {
      const response = await fetch('https://prehranko-production.up.railway.app/api/goals/set', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          caloricGoal: parseInt(caloricGoal),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Uspeh', 'Kalorični cilj je bil shranjen!');
        navigation.navigate('Home', { email });
      } else {
        throw new Error(data.error || 'Napaka pri shranjevanju cilja');
      }
    } catch (err) {
      Alert.alert('Napaka', err.message || 'Napaka pri povezavi s strežnikom');
      console.error('Error setting caloric goal:', err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vnesi trajni kalorični cilj</Text>
      <View style={styles.inputContainer}>
        <AuthInput
          placeholder="Kalorije (npr. 2500)"
          value={caloricGoal}
          onChangeText={setCaloricGoal}
          keyboardType="numeric"
        />
        <AuthButton title="Shrani cilj" onPress={handleSetGoal} />
        <View style={styles.buttonSpacing} />
        <AuthButton
          title="Nazaj"
          onPress={() => navigation.navigate('Home', { email })}
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
    width: '65%',
    alignSelf: 'center',
  },
  buttonSpacing: {
    marginTop: theme.spacing.medium,
  },
});