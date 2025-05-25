// screens/HomeScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import IconButton from '../components/IconButton';
import { homeStyles } from '../styles/homeStyles';
import { theme } from '../styles/theme';

const DATA = [
  { id: '1', title: 'Statistika', description: 'Preglej statistiko tvojih obrokov.' },
  { id: '2', title: 'Zajemi obrok', description: 'Dodaj nov obrok z uporabo kamere.' },
  { id: '3', title: 'Tvoji cilji', description: 'Dodaj ali spremeni tvoje cilje.' },
];

export default function HomeScreen({ navigation, route }) {
  const { email } = route.params || { email: 'Uporabnik' };

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
    <View style={homeStyles.container}>
      {/* Zgornji del: Ime aplikacije, gumb za nastavitve, ime uporabnika */}
      <View style={homeStyles.header}>
        <Text style={homeStyles.appName}>Prehranko</Text>
        <TouchableOpacity style={homeStyles.settingsButton} onPress={handleSettingsPress}>
          <Text style={homeStyles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>
      <Text style={homeStyles.userName}>Pozdravljen, {email}!</Text>

      {/* Sredinski del: Kartice */}
      <View style={homeStyles.cardsContainer}>
        {/* Statistika (večja kartica) */}
        <View style={homeStyles.statisticsCard}>
          <Text style={homeStyles.cardTitle}>{DATA[0].title}</Text>
          <Text style={homeStyles.cardDescription}>{DATA[0].description}</Text>
        </View>

        {/* Zajemi obrok in Recepti (manjše kartice) */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={[homeStyles.card, { width: '48%' }]}>
            <Text style={homeStyles.cardTitle}>{DATA[1].title}</Text>
            <Text style={homeStyles.cardDescription}>{DATA[1].description}</Text>
          </View>
          <View style={[homeStyles.card, { width: '48%' }]}>
            <Text style={homeStyles.cardTitle}>{DATA[2].title}</Text>
            <Text style={homeStyles.cardDescription}>{DATA[2].description}</Text>
          </View>
        </View>
      </View>

      {/* Spodnji del: Gumbi z ikonami */}
      <View style={homeStyles.buttonRow}>
        <IconButton
          iconName="camera"
          title="Zajemi obraz"
          onPress={handleCaptureFace}
          color={theme.colors.primary}
        />
        <IconButton
          iconName="bar-chart"
          title="Funkcija 1"
          onPress={() => handleFutureFeature('Funkcija 1')}
          color={theme.colors.secondary}
        />
        <IconButton
          iconName="book"
          title="Funkcija 2"
          onPress={() => handleFutureFeature('Funkcija 2')}
          color={theme.colors.secondary}
        />
      </View>
    </View>
  );
}