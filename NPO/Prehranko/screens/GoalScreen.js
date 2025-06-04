import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import AuthInput from '../components/TextInput';
import AuthButton from '../components/AuthButton';
import { theme } from '../styles/theme';

export default function GoalScreen({ navigation, route }) {
  const { email } = route.params || {};
  const [caloricGoal, setCaloricGoal] = useState('');
  const [proteinGoal, setProteinGoal] = useState('');

  const handleSetGoal = async () => {
    // Validacija za kalorični cilj
    if (!caloricGoal || isNaN(caloricGoal) || parseInt(caloricGoal) <= 0) {
      Alert.alert('Napaka', 'Vnesite veljaven kalorični cilj (pozitivno število).');
      return;
    }

    // Validacija za beljakovinski cilj
    if (!proteinGoal || isNaN(proteinGoal) || parseInt(proteinGoal) <= 0) {
      Alert.alert('Napaka', 'Vnesite veljaven cilj za beljakovine (pozitivno število).');
      return;
    }

    try {
      console.log('📩 Posiljam zahtevo za /api/goals/set:', { email, caloricGoal, proteinGoal });
      const response = await fetch('https://prehranko-production.up.railway.app/api/goals/set', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          caloricGoal: parseInt(caloricGoal),
          proteinGoal: parseInt(proteinGoal),
        }),
      });

      const data = await response.json();
      console.log('🌐 Odgovor od /api/goals/set:', { status: response.status, data });

      if (response.ok) {
        Alert.alert('Uspeh', 'Cilji so bili shranjeni!');
        navigation.navigate('Home', { email });
      } else {
        throw new Error(data.message || 'Napaka pri shranjevanju ciljev');
      }
    } catch (err) {
      Alert.alert('Napaka', err.message || 'Napaka pri povezavi s strežnikom');
      console.error('Error setting goals:', err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vnesi trajne cilje</Text>
      <View style={styles.inputContainer}>
        <AuthInput
          placeholder="Kalorije (npr. 2500)"
          value={caloricGoal}
          onChangeText={setCaloricGoal}
          keyboardType="numeric"
        />
        <AuthInput
          placeholder="Beljakovine (npr. 100)"
          value={proteinGoal}
          onChangeText={setProteinGoal}
          keyboardType="numeric"
        />
        <AuthButton title="Shrani cilje" onPress={handleSetGoal} />
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