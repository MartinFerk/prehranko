import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import IconButton from '../components/IconButton';
import { homeStyles } from '../styles/homeStyles';
import { theme } from '../styles/theme';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '../services/api'; // ⬅️ poskrbi da to ustreza tvojemu Express backendu
import * as Progress from 'react-native-progress'; // Dodaj za progress bar
import moment from 'moment'; // Dodaj za formatiranje datuma

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
  const [vsiObroki, setVsiObroki] = useState([]); // Changed from zadnjiObrok to vsiObroki
  const [todayCalories, setTodayCalories] = useState(0); // Novo stanje za današnje kalorije
  const [todayProtein, setTodayProtein] = useState(0); // Novo stanje za današnje beljakovine

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
    if (usernameFromStorage) setUsername(usernameFromStorage); // <-- PRAVILNO
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
      const res = await fetch(`${API_BASE_URL}/auth/check-2fa?email=${userEmail}`);
      const contentType = res.headers.get('content-type');
    
      if (!res.ok) throw new Error('Napaka pri preverjanju 2FA');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.warn('❌ Backend vrnil HTML – preveri URL in backend');
        console.log('📡 /check-2fa odgovor:', text);
        throw new Error('Odziv ni bil JSON');
      }
    
      const data = await res.json();
    
      if (data.trigger) {
        clearInterval(interval);
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
      } else {
        setCaloricGoal(null);
        setProteinGoal(null);
      }
    } catch (err) {
      console.error('Napaka pri pridobivanju ciljev:', err.message);
      setCaloricGoal(null);
      setProteinGoal(null);
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
        // Filtriraj današnje obroke in izračunaj skupne kalorije in beljakovine
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
    fetchUsername(); // prebere iz AsyncStorage
  }

  fetchEmail();
}, []);

  useEffect(() => {
    if (userEmail) {
      const stopPolling = pollFor2FA(); // Express
      check2FA(); // Railway
      fetchGoals();
      fetchVsiObroki();
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

    const handleCaptureFood = () => {
      navigation.navigate('CaptureFoodScreen', { email: userEmail });
    };

    const renderObrokItem = ({ item }) => {  
    return (
    <View style={{ marginTop: 10 }}>
      <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
      <Text>Kalorije: {item.calories} kcal </Text>
      <Text>Beljakovine: {item.protein} g</Text>
      <Text style={{ fontSize: 14, color: theme.colors.text }}>
            Datum: {moment(item.timestamp).format('DD.MM.YYYY HH:mm')}
      </Text>
    </View>
  );
};

  return (
  <View style={homeStyles.container}>
    <View style={homeStyles.header}>
      <Text style={homeStyles.appName}>Prehranko</Text>
      <TouchableOpacity style={homeStyles.settingsButton} onPress={handleSettingsPress}>
        <Text style={homeStyles.settingsIcon}>⚙️</Text>
      </TouchableOpacity>
    </View>
    <Text style={homeStyles.userName}>Pozdravljen, {username || 'Uporabnik'}!</Text>

    {pending2FA && (
      <Text style={{ color: 'red', marginTop: 10 }}>
        ⚠️ Zahteva za 2FA je aktivna (preveri obraz).
      </Text>
    )}

{/* Statistika card - full width at the top, showing all meals */}
      <View style={homeStyles.statisticsCard}>
        <Text style={homeStyles.cardTitle}>{DATA[0].title}</Text>
        <Text style={homeStyles.cardDescription}>{DATA[0].description}</Text>

        {vsiObroki.length > 0 ? (
          <FlatList
            data={vsiObroki}
            renderItem={renderObrokItem}
            keyExtractor={(item) => String(item.obrokId)}
            style={{ marginTop: 2 }}
          />
        ) : (
          <Text style={{ marginTop: 10 }}>Ni podatkov o obrokih.</Text>
        )}
      </View>

{/* Row for Zajemi obrok and Tvoji cilji cards */}
      <View style={homeStyles.cardsRow}>
<View style={[homeStyles.halfCard, homeStyles.zajemiObrokCard]}>
  <Text style={homeStyles.cardTitle}>{DATA[1].title}</Text>
  <View style={{ marginTop: 10 }}>
    <Text style={{ fontSize: 13, color: theme.colors.text }}>
      Kalorije: 
      <Text style={{ color: theme.colors.primary }}> {todayCalories} </Text>
      <Text style={{ color: theme.colors.text }}>/ </Text>
      <Text style={{ color: theme.colors.secondary }}>{caloricGoal || 'N/A'}</Text>
    </Text>

    <Progress.Bar
      progress={caloricGoal ? todayCalories / caloricGoal : 0}
      width={null}
      height={8}
      color={theme.colors.primary}
      unfilledColor={theme.colors.background}
      borderWidth={0}
      style={{ marginTop: 5, marginBottom: 10 }}/>

    <Text style={{ fontSize: 13, color: theme.colors.text }}>
      Beljakovine:
      <Text style={{ color: theme.colors.primary }}> {todayProtein} </Text>
      <Text style={{ color: theme.colors.text }}>/ </Text>
      <Text style={{ color: theme.colors.secondary }}>{proteinGoal || 'N/A'}</Text>
    </Text>

    <Progress.Bar
      progress={proteinGoal ? todayProtein / proteinGoal : 0}
      width={null}
      height={8}
      color={theme.colors.secondary}
      unfilledColor={theme.colors.background}
      borderWidth={0}
      style={{ marginTop: 5 }}/>
  </View>
</View>

      {/* Tvoji cilji card */}
      <View style={[homeStyles.halfCard, homeStyles.ciljiCard]}>
        <Text style={homeStyles.cardTitle}>{DATA[2].title}</Text>
        {caloricGoal !== null ? (
          <Text style={{ marginTop: 10, fontSize: 14, color: theme.colors.text }}>
            Kalorije: <Text style={{ marginTop: 10, fontSize: 14, color: theme.colors.secondary }}>
            {caloricGoal} kcal</Text> 
          </Text>

        ) : (
          <Text style={{ marginTop: 10, fontSize: 16, color: theme.colors.text }}>
            Ni nastavljenega kaloričnega cilja.</Text>
        )}
        {proteinGoal !== null ? (
          <Text style={{ marginTop: 10, fontSize: 14, color: theme.colors.text }}>
            Beljakovine: <Text style={{ marginTop: 10, fontSize: 14, color: theme.colors.secondary }}>
            {proteinGoal} g</Text> 
          </Text>
        ) : (
          <Text style={{ marginTop: 10, fontSize: 16, color: theme.colors.text }}>
            Ni nastavljenega beljakovinskega cilja.</Text>
        )}
      </View>
    </View>

    <View style={homeStyles.buttonRow}>
      <IconButton
        iconName="camera"
        title="Zajemi Obrok"
        onPress={() => navigation.navigate('CaptureFoodScreen', { email: userEmail })}
        color={theme.colors.secondary}/>

      <IconButton
        iconName="target"
        title="Nastavi Cilj"
        onPress={handleSetGoal}
        color={theme.colors.secondary}/>

      <IconButton
        iconName="delete"
        title="Izbriši Vnos"
        onPress={handleCaptureFace}
        color={theme.colors.secondary}/>
    </View>
  </View>
);
}