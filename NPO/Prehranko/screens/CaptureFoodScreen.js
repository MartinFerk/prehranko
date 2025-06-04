import React, { useState } from 'react';
import { View, Text, Button, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import uuid from 'react-native-uuid';
import { API_BASE_URL } from '../services/api';
import * as FileSystem from 'expo-file-system';
// Namesto: process.env.IMGUR_CLIENT_ID
import { IMGUR_CLIENT_ID } from '../services/api';



export default function CaptureFoodScreen({ navigation, route }) {
  const userEmail = route.params?.email;
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
    console.log(IMGUR_CLIENT_ID); // ✅ Deluje

  const pickImage = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const pickedUri = result.assets[0].uri;
      setImageUri(pickedUri);
      analyzeFoodImage(pickedUri);
    }

  };

  const uploadToImgur = async (uri) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const body = `image=${encodeURIComponent(base64)}`;

      const res = await fetch('https://api.imgur.com/3/image', {
        method: 'POST',
        headers: {
          Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body,
      });
            console.log('🔼 Pošiljam sliko na Imgur... ', base64.slice(0, 100));


      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.data?.error || 'Upload na Imgur ni uspel');
      }

      return data.data.link;
    } catch (error) {
      console.error('Napaka pri uploadu na Imgur:', error);
      throw error;
    }
  };

  const analyzeFoodImage = async (localUri) => {
    setLoading(true);
    setResult(null);

    try {
      const imgUrl = await uploadToImgur(localUri);
      const obrokId = uuid.v4();

      // 1️⃣ Ustvari obrok
      const createRes = await fetch(`${API_BASE_URL}/obroki/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ obrokId, userEmail, imgLink: imgUrl }),
      });

      if (!createRes.ok) throw new Error('Napaka pri ustvarjanju obroka');

      // 2️⃣ Pokliči analizo
      const analyzeRes = await fetch(`${API_BASE_URL}/obroki/analyze-food`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ obrokId, imageUrl: imgUrl }),
      });

      const analyzeData = await analyzeRes.json();

      if (!analyzeRes.ok) {
        Alert.alert('Napaka pri analizi', analyzeData.error || 'Nepoznana napaka');
        return;
      }

      setResult(analyzeData.obrok);
    } catch (err) {
      console.error('Napaka:', err.message);
      Alert.alert('Napaka', err.message);
    } finally {
      setLoading(false);
    }
  };

    const cancelObrok = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/obroki/delete/${result?.obrokId}`, {
        method: 'DELETE',
        });
        const text = await res.text(); // Get raw response
        console.log('Raw response from DELETE /obroki/delete:', text);

        const data = JSON.parse(text); // Try to parse
        if (res.ok) {
        Alert.alert('Obrok izbrisan');
        } else {
        Alert.alert('Napaka pri brisanju:', data.error || 'Neznana napaka');
        }
        navigation.navigate('Home', { email: userEmail });
    } catch (err) {
        console.error('Napaka pri brisanju obroka:', err.message);
        Alert.alert('Napaka pri brisanju obroka');
    }
    };


    return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' }}>
        <Button title="Zajemi obrok" onPress={pickImage} />

        {imageUri && (
        <Image source={{ uri: imageUri }} style={{ width: 300, height: 300, marginTop: 20 }} />
        )}

        {loading && <ActivityIndicator size="large" color="orange" style={{ marginTop: 20 }} />}

        {result && (
        <View style={{ marginTop: 30, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{result.name}</Text>
            <Text style={{ fontSize: 16 }}>Kalorije: {result.calories}</Text>
            <Text style={{ fontSize: 16 }}>Beljakovine: {result.protein} g</Text>

            <View style={{ flexDirection: 'row', marginTop: 20 }}>
            <Button
                title="Shrani"
                onPress={() => navigation.navigate('Home', { email: userEmail })}
            />
            <View style={{ width: 20 }} />
            <Button title="Prekliči" color="red" onPress={cancelObrok} />
            </View>
        </View>
        )}
    </View>
    );
}
