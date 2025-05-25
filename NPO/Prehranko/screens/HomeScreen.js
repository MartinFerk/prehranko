// screens/HomeScreen.js
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import AuthButton from '../components/AuthButton';
import { theme } from '../styles/theme';

const DATA = [
  { id: '1', title: 'Zajemi obrok', description: 'Dodaj nov obrok z uporabo kamere.' },
  { id: '2', title: 'Statistika', description: 'Preglej statistiko tvojih obrokov.' },
  { id: '3', title: 'Recepti', description: 'Odkrij nove recepte za zdrave obroke.' },
];

export default function HomeScreen({ navigation, route }) {
  const { email } = route.params || { email: 'Uporabnik' }; // Privzeto ime, če email ni poslan

  const renderCard = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardDescription}>{item.description}</Text>
    </View>
  );

  const handleSettingsPress = () => {
    navigation.navigate('SettingsScreen');
  };

  const handleCaptureFace = () => {
    navigation.navigate('CameraScreen', { email });
  };

  const handleFutureFeature = (feature) => {
    Alert.alert('Funkcionalnost še ni implementirana', `To bo ${feature} v prihodnosti.`);
  };

  return (
    <View style={styles.container}>
      {/* Zgornji del: Ime aplikacije, gumb za nastavitve, ime uporabnika */}
      <View style={styles.header}>
        <Text style={styles.appName}>Prehranko</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={handleSettingsPress}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.userName}>Pozdravljen, {email}!</Text>

      {/* Sredinski del: Okvirčki */}
      <FlatList
        data={DATA}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        style={styles.cardList}
        contentContainerStyle={styles.cardListContent}
      />

      {/* Spodnji del: Gumbi */}
      <View style={styles.buttonRow}>
        <AuthButton
          title="Zajemi obraz"
          onPress={handleCaptureFace}
          color={theme.colors.primary}
        />
        <AuthButton
          title="Funkcija 1"
          onPress={() => handleFutureFeature('Funkcija 1')}
          color={theme.colors.secondary}
        />
        <AuthButton
          title="Funkcija 2"
          onPress={() => handleFutureFeature('Funkcija 2')}
          color={theme.colors.secondary}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.large,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.large,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  settingsButton: {
    padding: theme.spacing.small,
  },
  settingsIcon: {
    fontSize: 24,
  },
  userName: {
    fontSize: 18,
    color: theme.colors.secondary,
    marginVertical: theme.spacing.medium,
  },
  cardList: {
    flex: 1,
  },
  cardListContent: {
    paddingVertical: theme.spacing.medium,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: theme.spacing.medium,
    marginBottom: theme.spacing.medium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.small,
  },
  cardDescription: {
    fontSize: 14,
    color: theme.colors.secondary,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.large,
  },
});