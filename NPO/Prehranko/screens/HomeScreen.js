import React, { useEffect, useState } from 'react';
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
  const [pending2FA, setPending2FA] = useState(false);

  useEffect(() => {
    if (!email) return;

    const check2FA = async () => {
      try {
        const res = await fetch(`https://prehranko-production.up.railway.app/api/auth/status?email=${email}`);
        const data = await res.json();
        if (data.pending2FA) {
          setPending2FA(true);
          Alert.alert(
            '🔐 Potrebna je 2FA verifikacija',
            'Za prijavo v spletno aplikacijo moraš preveriti obraz.',
            [
              {
                text: 'Začni zdaj',
                onPress: () => navigation.navigate('FaceVerification', { email }),
              },
              { text: 'Prekliči', style: 'cancel' },
            ]
          );
        }
      } catch (err) {
        console.error('Napaka pri preverjanju 2FA:', err.message);
      }
    };

    check2FA();
  }, [email]);

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
      <View style={homeStyles.header}>
        <Text style={homeStyles.appName}>Prehranko</Text>
        <TouchableOpacity style={homeStyles.settingsButton} onPress={handleSettingsPress}>
          <Text style={homeStyles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>
      <Text style={homeStyles.userName}>Pozdravljen, {email}!</Text>

      {pending2FA && (
        <Text style={{ color: 'red', marginTop: 10 }}>
          ⚠️ Zahteva za 2FA je aktivna (preveri obraz).
        </Text>
      )}

      <View style={homeStyles.cardsContainer}>
        <View style={homeStyles.statisticsCard}>
          <Text style={homeStyles.cardTitle}>{DATA[0].title}</Text>
          <Text style={homeStyles.cardDescription}>{DATA[0].description}</Text>
        </View>

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

      <View style={homeStyles.buttonRow}>
        <IconButton
          iconName="camera"
          title="Zajemi obraz"
          onPress={handleCaptureFace}
          color={theme.colors.primary}
        />
        <IconButton
          iconName="bar-chart"
          title="Sledenje"
          onPress={() => navigation.navigate('ActivityScreen', { email })}
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
