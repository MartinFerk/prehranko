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
  const [temperature, setTemperature] = useState(null); // ⬅️ Dodano stanje za temperaturo
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


  const check2FA = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/check-2fa?email=${userEmail}`);
      const contentType = res.headers.get('content-type');

      if (!res.ok) throw new Error('Napaka pri preverjanju 2FA');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.warn('❌ Backend vrnil HTML – preveri URL in backend');
        throw new Error('Odziv ni bil JSON');
      }

      const data = await res.json();

      if (data.trigger) {
        navigation.navigate('CameraScreen', { mode: 'verify', email: userEmail });
      }
    } catch (err) {
      console.log('Napaka pri preverjanju 2FA:', err.message);
    }
  };

  const fetchGoals = async () => {
    if (!userEmail) return;

    try {
      const res = await fetch(
          `https://prehranko-production.up.railway.app/api/goals/get?email=${encodeURIComponent(userEmail)}`
      );
      const contentType = res.headers.get('content-type');

      if (!res.ok) {
        throw new Error(`Napaka pri pridobivanju ciljev: ${res.status}`);
      }
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.warn('❌ Backend vrnil HTML:', text);
        throw new Error('Odziv ni bil JSON');
      }

      const data = await res.json();
      console.log('🌐 Odgovor od /api/goals/get:', { status: res.status, data });

      if (res.ok) {
        setCaloricGoal(data.caloricGoal);
        setProteinGoal(data.proteinGoal);
        setTemperature(data.temperature); // ⬅️ Shranimo temperaturo iz baze v stanje
      } else {
        setCaloricGoal(null);
        setProteinGoal(null);
        setTemperature(null);
      }
    } catch (err) {
      console.error('Napaka pri pridobivanju ciljev:', err.message);
      setCaloricGoal(null);
      setProteinGoal(null);
      setTemperature(null);
    }
  };

  const fetchVsiObroki = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/obroki/all?email=${encodeURIComponent(userEmail)}`);
      const text = await res.text();
      console.log('Raw response from /obroki/all:', text);

      const data = JSON.parse(text);
      if (res.ok && data) {
        setVsiObroki(data);
        const today = moment().startOf('day');
        const todayMeals = data.filter((obrok) =>
            moment(obrok.timestamp).isSame(today, 'day')
        );
        const totalCalories = todayMeals.reduce((sum, obrok) => sum + (obrok.calories || 0), 0);
        const totalProtein = todayMeals.reduce((sum, obrok) => sum + (obrok.protein || 0), 0);
        setTodayCalories(totalCalories);
        setTodayProtein(totalProtein);
      }
    } catch (err) {
      console.warn('Napaka pri pridobivanju vseh obrokov:', err.message);
    }
  };

  useEffect(() => {
    if (route.params?.username) {
      setUsername(route.params.username);
    } else {
      fetchUsername();
    }
    fetchEmail();
  }, []);

  useEffect(() => {
    if (userEmail) {
      const stopPolling = pollFor2FA();
      check2FA();
      fetchGoals();
      fetchVsiObroki();
      return stopPolling;
    }
  }, [userEmail]);

  const handleSettingsPress = () => {
    navigation.navigate('SettingsScreen', { email: userEmail });
  };

  const handleSetGoal = () => {
    navigation.navigate('GoalScreen', { email: userEmail });
  };

  const handleDeleteFood = () => {
    navigation.navigate('DeleteFoodScreen', { email: userEmail });
  };

  const renderObrokItem = ({ item }) => {
    return (
        <View style={{ marginTop: 10, paddingBottom: 5, borderBottomWidth: 0.5, borderBottomColor: '#eee' }}>
          <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
          <Text>Kalorije: {item.calories} kcal | Beljakovine: {item.protein} g</Text>
          <Text style={{ fontSize: 12, color: theme.colors.text }}>
            {moment(item.timestamp).format('DD.MM.YYYY HH:mm')}
          </Text>
        </View>
    );
  };

  return (
      <View style={homeStyles.container}>
        {/* Header */}
        <View style={homeStyles.header}>
          <Text style={homeStyles.appName}>Prehranko</Text>
          <TouchableOpacity style={homeStyles.settingsButton} onPress={handleSettingsPress}>
            <Text style={homeStyles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <Text style={homeStyles.userName}>Pozdravljen, {username || 'Uporabnik'}!</Text>

        {/* 🌡️ NOVI WIDGET ZA TEMPERATURO (STM32) */}
        <View style={{
          alignSelf: 'center',
          alignItems: 'center',
          backgroundColor: '#fff',
          paddingVertical: 15,
          paddingHorizontal: 25,
          borderRadius: 25,
          width: '90%',
          marginVertical: 12,
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
        }}>
          <Text style={{ fontSize: 11, color: '#999', letterSpacing: 1.5, marginBottom: 5 }}>STATUS SENZORJA STM32</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 42, fontWeight: 'bold', color: theme.colors.secondary }}>
              {temperature !== undefined && temperature !== null ? `${temperature.toFixed(1)}°C` : '--.-°C'}
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: theme.colors.primary, marginTop: 4 }}>
            {temperature ? 'Podatek posodobljen v živo' : 'Čakam na meritev...'}
          </Text>
        </View>

        {pending2FA && (
            <Text style={{ color: 'red', marginTop: 5, textAlign: 'center' }}>
              ⚠️ Zahteva za 2FA je aktivna (preveri obraz).
            </Text>
        )}

        {/* Statistika card */}
        <View style={[homeStyles.statisticsCard, { flex: 0.8 }]}>
          <Text style={homeStyles.cardTitle}>{DATA[0].title}</Text>
          <Text style={homeStyles.cardDescription}>{DATA[0].description}</Text>

          {vsiObroki.length > 0 ? (
              <FlatList
                  data={vsiObroki}
                  renderItem={renderObrokItem}
                  keyExtractor={(item) => String(item.obrokId)}
                  style={{ marginTop: 5 }}
              />
          ) : (
              <Text style={{ marginTop: 10 }}>Ni podatkov o obrokih.</Text>
          )}
        </View>

        {/* Row for Daily Overview and Goals */}
        <View style={homeStyles.cardsRow}>
          <View style={[homeStyles.halfCard, homeStyles.zajemiObrokCard]}>
            <Text style={homeStyles.cardTitle}>{DATA[1].title}</Text>
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 12, color: theme.colors.text }}>
                Kalorije: {todayCalories} / {caloricGoal || 'N/A'}
              </Text>
              <Progress.Bar
                  progress={caloricGoal ? todayCalories / caloricGoal : 0}
                  width={null}
                  height={6}
                  color={theme.colors.primary}
                  unfilledColor="#e0e0e0"
                  borderWidth={0}
                  style={{ marginTop: 4, marginBottom: 8 }}/>

              <Text style={{ fontSize: 12, color: theme.colors.text }}>
                Beljakovine: {todayProtein} / {proteinGoal || 'N/A'}
              </Text>
              <Progress.Bar
                  progress={proteinGoal ? todayProtein / proteinGoal : 0}
                  width={null}
                  height={6}
                  color={theme.colors.secondary}
                  unfilledColor="#e0e0e0"
                  borderWidth={0}
                  style={{ marginTop: 4 }}/>
            </View>
          </View>

          {/* Tvoji cilji card */}
          <View style={[homeStyles.halfCard, homeStyles.ciljiCard]}>
            <Text style={homeStyles.cardTitle}>{DATA[2].title}</Text>
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 13, color: theme.colors.text }}>
                🔥 {caloricGoal ? `${caloricGoal} kcal` : 'Ni cilja'}
              </Text>
              <Text style={{ fontSize: 13, color: theme.colors.text, marginTop: 5 }}>
                🥩 {proteinGoal ? `${proteinGoal} g` : 'Ni cilja'}
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Navigation Buttons */}
        <View style={homeStyles.buttonRow}>
          <IconButton
              iconName="camera"
              title="Zajemi"
              onPress={() => navigation.navigate('CaptureFoodScreen', { email: userEmail })}
              color={theme.colors.secondary}/>

          <IconButton
              iconName="target"
              title="Cilj"
              onPress={handleSetGoal}
              color={theme.colors.secondary}/>

          <IconButton
              iconName="delete"
              title="Izbriši"
              onPress={handleDeleteFood}
              color={theme.colors.secondary}/>
        </View>
      </View>
  );
}