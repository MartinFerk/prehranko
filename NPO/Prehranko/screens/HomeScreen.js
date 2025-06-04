import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import IconButton from '../components/IconButton';
import { homeStyles } from '../styles/homeStyles';
import { theme } from '../styles/theme';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '../services/api'; // ⬅️ poskrbi da to ustreza tvojemu Express backendu

const DATA = [
  { id: '1', title: 'Statistika', description: 'Preglej statistiko tvojih obrokov.' },
  { id: '2', title: 'Zajemi obrok', description: 'Dodaj nov obrok z uporabo kamere.' },
  { id: '3', title: 'Tvoji cilji', description: 'Dodaj ali spremeni tvoje cilje.' },
];

export default function HomeScreen({ navigation, route }) {
  const [userEmail, setUserEmail] = useState(route.params?.email || null);
  const [pending2FA, setPending2FA] = useState(false);
  const [caloricGoal, setCaloricGoal] = useState(null);

  const fetchEmail = async () => {
    try {
      const emailFromStorage = await AsyncStorage.getItem('userEmail');
      if (emailFromStorage) setUserEmail(emailFromStorage);
    } catch (err) {
      console.error('Napaka pri branju e-pošte iz AsyncStorage:', err.message);
    }
  };

  const pollFor2FA = () => {
    const interval = setInterval(async () => {
      try {
        if (!userEmail) return;
  
        const res = await fetch(`${API_BASE_URL}/auth/check-2fa?email=${encodeURIComponent(userEmail)}`);
        const text = await res.text();
  
        // Debug izpis
        console.log('📡 /check-2fa odgovor:', text);
  
        // Če dobimo HTML, ne nadaljujemo
        if (text.trim().startsWith('<')) {
          console.warn('❌ Backend vrnil HTML – preveri URL in backend');
          return;
        }
  
        const data = JSON.parse(text);
  
        if (data.trigger) {
          clearInterval(interval);
          Alert.alert(
            '🔐 2FA preverjanje',
            'Odpri kamero in preveri obraz.',
            [
              {
                text: 'Začni',
                onPress: () => navigation.navigate('CameraScreen', { mode: 'verify', email: userEmail }),
              },
              { text: 'Prekliči', style: 'cancel' },
            ]
          );
        }
      } catch (err) {
        console.error('Napaka pri preverjanju 2FA:', err.message);
      }
    }, 5000);
  
    return () => clearInterval(interval);
  };
  

  // Preveri 2FA status (Railway backend) — opcijsko
  const check2FA = async () => {
    try {
      const res = await fetch(`https://prehranko-production.up.railway.app/api/auth/status?email=${userEmail}`);
      const data = await res.json();
      if (data.pending2FA) {
        setPending2FA(true);
        Alert.alert(
          '🔐 Potrebna je 2FA verifikacija',
          'Za prijavo v spletno aplikacijo moraš preveriti obraz.',
          [
            {
              text: 'Začni zdaj',
              onPress: () => navigation.navigate('CameraScreen', { mode: 'verify', email: userEmail }),
            },
            { text: 'Prekliči', style: 'cancel' },
          ]
        );
      }
    } catch (err) {
      console.error('Napaka pri preverjanju 2FA (Railway):', err.message);
    }
  };

  const fetchCaloricGoal = async () => {
    try {
      const res = await fetch(
        `https://prehranko-production.up.railway.app/api/goals/get?email=${encodeURIComponent(userEmail)}`
      );
      const data = await res.json();
      if (res.ok) {
        setCaloricGoal(data.caloricGoal);
      } else {
        setCaloricGoal(null);
      }
    } catch (err) {
      console.error('Napaka pri pridobivanju kaloričnega cilja:', err.message);
      setCaloricGoal(null);
    }
  };

  // Ob zagonu
  useEffect(() => {
    fetchEmail();
  }, []);

  useEffect(() => {
    if (userEmail) {
      const stopPolling = pollFor2FA(); // Express
      check2FA(); // Railway
      fetchCaloricGoal();
      return stopPolling;
    }
  }, [userEmail]);

  const handleSettingsPress = () => {
    navigation.navigate('SettingsScreen', { email: userEmail });
  };

  const handleCaptureFace = () => {
    navigation.navigate('CameraScreen', { mode: 'register', email: userEmail });
  };

  const handleSetGoal = () => {
    navigation.navigate('GoalScreen', { email: userEmail });
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
      <Text style={homeStyles.userName}>Pozdravljen, {userEmail || 'Uporabnik'}!</Text>

      {pending2FA && (
        <Text style={{ color: 'red', marginTop: 10 }}>
          ⚠️ Zahteva za 2FA je aktivna (preveri obraz).
        </Text>
      )}

      <View style={homeStyles.cardsContainer}>
        <View style={homeStyles.statisticsCard}>
          <Text style={homeStyles.cardTitle}>{DATA[0].title}</Text>
          <Text style={homeStyles.cardDescription}>{DATA[0].description}</Text>
          {caloricGoal !== null ? (
            <Text style={{ marginTop: 10, fontSize: 16, color: theme.colors.primary }}>
              Trajni cilj: {caloricGoal} kalorij
            </Text>
          ) : (
            <Text style={{ marginTop: 10, fontSize: 16, color: theme.colors.text }}>
              Ni nastavljenega kaloričnega cilja.
            </Text>
          )}
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
          onPress={() => navigation.navigate('ActivityScreen', { email: userEmail })}
          color={theme.colors.secondary}
        />
        <IconButton
          iconName="target"
          title="Nastavi cilj"
          onPress={handleSetGoal}
          color={theme.colors.secondary}
        />
      </View>
    </View>
  );
}
