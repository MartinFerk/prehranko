import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import { homeStyles } from '../styles/homeStyles';
import { theme } from '../styles/theme';
import { API_BASE_URL } from '../services/api';
import AuthButton from '../components/AuthButton';
export default function DeleteFoodScreen({ navigation, route }) {
  const [userEmail, setUserEmail] = useState(route.params?.email || null);
  const [vsiObroki, setVsiObroki] = useState([]);

  // Fetch email from AsyncStorage
  const fetchEmail = async () => {
    try {
      const emailFromStorage = await AsyncStorage.getItem('userEmail');
      if (emailFromStorage) setUserEmail(emailFromStorage);
    } catch (err) {
      console.error('Napaka pri branju e-pošte iz AsyncStorage:', err.message);
    }
  };

  // Fetch all meals from backend
  const fetchVsiObroki = async () => {
    if (!userEmail) return;
    try {
      const res = await fetch(`${API_BASE_URL}/obroki/all?email=${encodeURIComponent(userEmail)}`);
      const text = await res.text();
      console.log('Raw response from /obroki/all:', text);

      if (!res.ok) {
        throw new Error(`Napaka pri pridobivanju obrokov: ${res.status}`);
      }

      const data = JSON.parse(text);
      setVsiObroki(data || []);
    } catch (err) {
      console.warn('Napaka pri pridobivanju vseh obrokov:', err.message);
      setVsiObroki([]);
    }
  };

  const deleteObrok = async (obrokId) => {
  if (!obrokId) return;
  try {
    const res = await fetch(`${API_BASE_URL}/obroki/delete/${encodeURIComponent(obrokId)}`, {
      method: 'DELETE',
    });

    const text = await res.text();
    console.log('Raw response from /obroki/delete:', text);

    if (!res.ok) {
      throw new Error(`Napaka pri brisanju obroka: ${res.status}`);
    }

    await fetchVsiObroki();
    Alert.alert('Uspeh', 'Obrok je bil uspešno izbrisan.');
  } catch (err) {
    console.error('Napaka pri brisanju obroka:', err.message);
    Alert.alert('Napaka', 'Prišlo je do napake pri brisanju obroka.');
  }
};


  // Confirm deletion with Alert
  const confirmDelete = (obrokId, obrokName) => {
    Alert.alert(
      'Potrdi brisanje',
      `Ali res želite izbrisati obrok "${obrokName}"?`,
      [
        { text: 'Prekliči', style: 'cancel' },
        {
          text: 'Izbriši',
          style: 'destructive',
          onPress: () => deleteObrok(obrokId),
        },
      ]
    );
  };

  // Render each meal item
  const renderObrokItem = ({ item }) => (
    <TouchableOpacity
      style={[homeStyles.statisticsCard, { marginBottom: 10 }]}
      onPress={() => confirmDelete(item.obrokId, item.name)}>
      <Text style={homeStyles.cardTitle}>{item.name}</Text>
      <Text style={{ fontSize: 14, color: theme.colors.text }}>
        Kalorije: {item.calories} kcal
      </Text>
      <Text style={{ fontSize: 14, color: theme.colors.text }}>
        Beljakovine: {item.protein} g
      </Text>
      <Text style={{ fontSize: 14, color: theme.colors.text }}>
        Datum: {moment(item.timestamp).format('DD.MM.YYYY HH:mm')}
      </Text>
    </TouchableOpacity>
  );

  // Fetch email and meals on mount
  useEffect(() => {
    fetchEmail();
  }, []);

  useEffect(() => {
    if (userEmail) {
      fetchVsiObroki();
    }
  }, [userEmail]);

  return (
    <View style={homeStyles.container}>
      <View style={homeStyles.header}>
        <Text style={homeStyles.appName}>Izbriši obrok</Text>
        <TouchableOpacity
          style={homeStyles.settingsButton}
          onPress={() => navigation.navigate('SettingsScreen', { email: userEmail })}
        >
          <Text style={homeStyles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {vsiObroki.length > 0 ? (
        <FlatList
          data={vsiObroki}
          renderItem={renderObrokItem}
          keyExtractor={(item) => item.obrokId.toString()}
          style={{ marginTop: 10 }}
        />
      ) : (
        <Text style={{ marginTop: 10, fontSize: 16, color: theme.colors.text }}>
          Ni podatkov o obrokih.
        </Text>
      )}
<AuthButton
  title="Nazaj"
  onPress={() => navigation.goBack()}
  color={theme.colors.secondary}
/>

      
    </View>
  );
}