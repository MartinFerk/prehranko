import React, { useState } from 'react';
import { View, Text, Button, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import uuid from 'react-native-uuid';
import { API_BASE_URL } from '../services/api';
import * as FileSystem from 'expo-file-system';
import { IMGUR_CLIENT_ID } from '../services/api';
import * as Location from 'expo-location';

export default function CaptureFoodScreen({ navigation, route }) {
  const userEmail = route.params?.email;
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  console.log(IMGUR_CLIENT_ID);

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
    import { compressImageDCT } from '../utils/compression';

    const analyzeFoodImage = async (localUri) => {
        setLoading(true);
        setResult(null);

        try {
            // 1. Pridobi lokacijo
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') throw new Error('Dovoljenje za lokacijo ni odobreno');

            const location = await Location.getCurrentPositionAsync({});
            const locX = location.coords.longitude;
            const locY = location.coords.latitude;

            // 2. DCT Kompresija (Namesto Imgurja)
            // Opomba: Za compressImageDCT boš verjetno potreboval piksle,
            // širino in višino (npr. 128x128).
            const width = 128;
            const height = 128;
            const compressedBinary = await compressImageDCT(localUri, width, height);

            // Pretvori Uint8Array v Base64 niz za prenos preko JSON-a
            const base64ForPost = Buffer.from(compressedBinary).toString('base64');

            const obrokId = uuid.v4();

            // 3. POKLIČI NOVI ROUTE: /api/images/uploadimg
            // Ta klic bo naredil VSE: dekompresijo, OpenAI, shranil sliko in shranil obrok.
            const response = await fetch(`${API_BASE_URL}/images/uploadimg`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    obrokId,
                    userEmail,
                    compressedData: base64ForPost,
                    locX,
                    locY,
                    width,
                    height
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Napaka pri obdelavi na strežniku');
            }

            // Rezultat dobimo nazaj že analiziran s strani OpenAI
            setResult(data.obrok);

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
