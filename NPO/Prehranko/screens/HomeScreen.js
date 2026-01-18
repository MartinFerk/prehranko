import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import IconButton from '../components/IconButton';
import { homeStyles } from '../styles/homeStyles';
import { theme } from '../styles/theme';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '../services/api';
import * as Progress from 'react-native-progress';
import moment from 'moment';

const DATA = [
  { id: '1', title: 'Statistika', description: 'Tukaj so prikazani vaši vnosi' },
  { id: '2', title: 'Dnevni pregled'},
  { id: '3', title: 'Vaši cilji'},
];

export default function HomeScreen({ navigation, route }) {
  const [username, setUsername] = useState(null);
  const [userEmail, setUserEmail] = useState(route.params?.email || null);
  const [pending2FA, setPending2FA] = useState(false);
  const [caloricGoal, setCaloricGoal] = useState(null);
  const [proteinGoal, setProteinGoal] = useState(null);
  const [temperature, setTemperature] = useState(null);
  const [vsiObroki, setVsiObroki] = useState([]);
  
  const [todayCalories, setTodayCalories] = useState(0);
  const [todayProtein, setTodayProtein] = useState(0);

  const fetchEmail = async () => {
    try {
      const emailFromStorage = await AsyncStorage.getItem('userEmail');
      if (emailFromStorage) setUserEmail(emailFromStorage);
    } catch (err) {
      console.error('Napaka pri branju e-pošte iz AsyncStorage:', err.message);
    }
  };

  const fetchUsername = async () => {
    try {
      const usernameFromStorage = await AsyncStorage.getItem('username');
      if (usernameFromStorage) setUsername(usernameFromStorage);
    } catch (err) {
      console.error('Napaka pri branju uporabniškega imena iz AsyncStorage:', err.message);
    }
  };

  const pollFor2FA = () => {
    const interval = setInterval(async () => {
      try {
        if (!userEmail) return;
        const res = await fetch(`${API_BASE_URL}/auth/check-2fa?email=${encodeURIComponent(userEmail)}`);
        const text = await res.text();
        if (text.trim().startsWith('<')) return;

        const data = JSON.parse(text);
        if (data.trigger) {
          clearInterval(interval);
          Alert.alert(
              '🔐 2FA preverjanje',
              'Odpri kamero in preveri obraz.',
              [
                { text: 'Začni', onPress: () => navigation.navigate('CameraScreen', { mode: 'verify', email: userEmail }) },
                { text: 'Prekliči', style: 'cancel' },
              ]
          );
        }
      } catch (err) {
        console.error('Napaka pri preverjanju 2FA (polling):', err.message);
      }
    }, 5000);
    return () => clearInterval(interval);
  };


  const check2FA = async () => {
    try {
      if (!userEmail) return;
      const res = await fetch(`${API_BASE_URL}/auth/check-2fa?email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      if (data.trigger) {
        navigation.navigate('CameraScreen', { mode: 'verify', email: userEmail });
      }
    } catch (err) {
      console.log('Napaka pri enkratnem preverjanju 2FA:', err.message);
    }
  };

  const fetchGoals = async () => {
    if (!userEmail) return;
    try {
      const res = await fetch(`https://prehranko-production.up.railway.app/api/goals/get?email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      if (res.ok) {
        setCaloricGoal(data.caloricGoal);
        setProteinGoal(data.proteinGoal);
        setTemperature(data.temperature);
      }
    } catch (err) {
      console.error('Napaka pri pridobivanju ciljev:', err.message);
    }
  };

  const fetchVsiObroki = async () => {
    try {
      if (!userEmail) return;
      const res = await fetch(`${API_BASE_URL}/obroki/all?email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      if (res.ok && data) {
        setVsiObroki(data);
        const today = moment().startOf('day');
        const todayMeals = data.filter((obrok) => moment(obrok.timestamp).isSame(today, 'day'));
        setTodayCalories(todayMeals.reduce((sum, obrok) => sum + (obrok.calories || 0), 0));
        setTodayProtein(todayMeals.reduce((sum, obrok) => sum + (obrok.protein || 0), 0));
      }
    } catch (err) {
      console.warn('Napaka pri pridobivanju obrokov:', err.message);
    }
  };

  useEffect(() => {
    if (route.params?.username) setUsername(route.params.username);
    else fetchUsername();
    fetchEmail();
  }, []);

  // ✅ POPRAVLJEN EFFECT Z ZAMIKOM
  useEffect(() => {
    let stopPolling = null;
    let initialDelay = null;

    if (userEmail) {
      fetchGoals();
      fetchVsiObroki();

      // Začni 2FA preverjanje šele po 3 sekundah
      initialDelay = setTimeout(() => {
        console.log("⏱️ 3 sekunde pretekle, preverjam 2FA status...");
        check2FA();
        stopPolling = pollFor2FA();
      }, 3000);
    }

    return () => {
      if (initialDelay) clearTimeout(initialDelay);
      if (stopPolling) stopPolling();
    };
  }, [userEmail]);

  const handleSettingsPress = () => navigation.navigate('SettingsScreen', { email: userEmail });
  const handleSetGoal = () => navigation.navigate('GoalScreen', { email: userEmail });
  const handleDeleteFood = () => navigation.navigate('DeleteFoodScreen', { email: userEmail });

  const renderObrokItem = ({ item }) => (
      <View style={{ marginTop: 10, paddingBottom: 5, borderBottomWidth: 0.5, borderBottomColor: '#eee' }}>
        <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
        <Text>Kalorije: {item.calories} kcal | Beljakovine: {item.protein} g</Text>
        <Text style={{ fontSize: 12, color: theme.colors.text }}>{moment(item.timestamp).format('DD.MM.YYYY HH:mm')}</Text>
      </View>
  );

  return (
      <View style={homeStyles.container}>
        <View style={homeStyles.header}>
          <Text style={homeStyles.appName}>Prehranko</Text>
          <TouchableOpacity style={homeStyles.settingsButton} onPress={handleSettingsPress}>
            <Text style={homeStyles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <Text style={homeStyles.userName}>Pozdravljen, {username || 'Uporabnik'}!</Text>

        {/* 🌡️ TEMPERATURE WIDGET */}
        <View style={{
          alignSelf: 'center', alignItems: 'center', backgroundColor: '#fff',
          paddingVertical: 15, paddingHorizontal: 25, borderRadius: 25,
          width: '90%', marginVertical: 12, elevation: 4, shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4,
        }}>
          <Text style={{ fontSize: 11, color: '#999', letterSpacing: 1.5, marginBottom: 5 }}>STATUS SENZORJA STM32</Text>
          <Text style={{ fontSize: 42, fontWeight: 'bold', color: theme.colors.secondary }}>
            {temperature !== undefined && temperature !== null ? `${temperature.toFixed(1)}°C` : '--.-°C'}
          </Text>
          <Text style={{ fontSize: 12, color: theme.colors.primary, marginTop: 4 }}>
            {temperature ? 'Podatek posodobljen v živo' : 'Čakam na meritev...'}
          </Text>
        </View>

        {pending2FA && (
            <Text style={{ color: 'red', marginTop: 5, textAlign: 'center' }}>⚠️ Zahteva za 2FA je aktivna.</Text>
        )}

        {/* Statistika */}
        <View style={[homeStyles.statisticsCard, { flex: 0.8 }]}>
          <Text style={homeStyles.cardTitle}>{DATA[0].title}</Text>
          <FlatList
              data={vsiObroki}
              renderItem={renderObrokItem}
              keyExtractor={(item) => String(item.obrokId)}
              style={{ marginTop: 5 }}
              ListEmptyComponent={<Text>Ni podatkov o obrokih.</Text>}
          />
        </View>

        {/* Row for Progress and Goals */}
        <View style={homeStyles.cardsRow}>
          <View style={[homeStyles.halfCard, homeStyles.zajemiObrokCard]}>
            <Text style={homeStyles.cardTitle}>{DATA[1].title}</Text>
            <Text style={{ fontSize: 12 }}>Kalorije: {todayCalories} / {caloricGoal || 'N/A'}</Text>
            <Progress.Bar progress={caloricGoal ? todayCalories / caloricGoal : 0} width={null} color={theme.colors.primary} style={{ marginVertical: 5 }} />
            <Text style={{ fontSize: 12 }}>Beljakovine: {todayProtein} / {proteinGoal || 'N/A'}</Text>
            <Progress.Bar progress={proteinGoal ? todayProtein / proteinGoal : 0} width={null} color={theme.colors.secondary} style={{ marginTop: 5 }} />
          </View>

          <View style={[homeStyles.halfCard, homeStyles.ciljiCard]}>
            <Text style={homeStyles.cardTitle}>{DATA[2].title}</Text>
            <Text style={{ fontSize: 13, marginTop: 5 }}>🔥 {caloricGoal ? `${caloricGoal} kcal` : 'N/A'}</Text>
            <Text style={{ fontSize: 13 }}>🥩 {proteinGoal ? `${proteinGoal} g` : 'N/A'}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={homeStyles.buttonRow}>
          <IconButton iconName="camera" title="Zajemi" onPress={() => navigation.navigate('CaptureFoodScreen', { email: userEmail })} color={theme.colors.secondary}/>
          <IconButton iconName="target" title="Cilj" onPress={handleSetGoal} color={theme.colors.secondary}/>
          <IconButton iconName="delete" title="Izbriši" onPress={handleDeleteFood} color={theme.colors.secondary}/>
        </View>
      </View>
  );
}