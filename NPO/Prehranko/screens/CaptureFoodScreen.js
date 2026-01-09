import React, { useState } from 'react';
import { View, Text, Button, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import uuid from 'react-native-uuid';
import * as Location from 'expo-location';
import { Buffer } from 'buffer'; // Ne pozabi: npm install buffer

// Uvozi tvoje pomožne funkcije
import { API_BASE_URL } from '../services/api';
import { compressImageDCT } from '../utils/compression';

export default function CaptureFoodScreen({ navigation, route }) {
    const userEmail = route.params?.email;
    const [imageUri, setImageUri] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    // 1. Izbira slike s kamero
    const pickImage = async () => {
        const pickerResult = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1], // Za DCT je najbolje imeti kvadratno sliko
            quality: 0.7,
        });

        if (!pickerResult.canceled && pickerResult.assets?.length > 0) {
            const pickedUri = pickerResult.assets[0].uri;
            setImageUri(pickedUri);
            // Takoj sprožimo analizo z novim postopkom
            analyzeFoodImage(pickedUri);
        }
    };

    // 2. Glavna logika: Kompresija in pošiljanje na Backend
    const analyzeFoodImage = async (localUri) => {
        setLoading(true);
        setResult(null);

        try {
            // A) Pridobivanje lokacije
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Napaka', 'Dovoljenje za lokacijo je obvezno.');
                setLoading(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const { longitude: locX, latitude: locY } = location.coords;

            // B) DCT Kompresija
            // Uporabimo fiksno velikost 128x128 za hitrost in kompatibilnost
            const width = 512;
            const height = 512;

            console.log('Stiskam sliko z DCT...');
            const compressedBinary = await compressImageDCT(localUri, width, height);

            // C) Priprava podatkov za prenos (Uint8Array -> Base64)
            const base64Data = Buffer.from(compressedBinary).toString('base64');
            const obrokId = uuid.v4();

            // D) Pošiljanje na tvoj NOVI backend endpoint
            console.log('Pošiljam stisnjene podatke na backend...');
            const response = await fetch(`${API_BASE_URL}/images/uploadimg`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    obrokId,
                    userEmail,
                    compressedData: base64Data,
                    locX,
                    locY,
                    width,
                    height,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Napaka pri obdelavi na strežniku');
            }

            // Shranimo rezultat analize, ki jo je vrnil OpenAI preko tvojega backenda
            setResult(data.obrok);

        } catch (err) {
            console.error('Napaka pri analizi:', err.message);
            Alert.alert('Napaka', err.message);
        } finally {
            setLoading(false);
        }
    };

    // 3. Brisanje obroka, če uporabnik klikne "Prekliči"
    const cancelObrok = async () => {
        if (!result?.obrokId) return;

        try {
            const res = await fetch(`${API_BASE_URL}/obroki/delete/${result.obrokId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                Alert.alert('Preklicano', 'Obrok je bil izbrisan.');
                navigation.navigate('Home', { email: userEmail });
            }
        } catch (err) {
            console.error('Napaka pri brisanju:', err.message);
        }
    };

    return (
        <View style={{ flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' }}>
            {!result && !loading && (
                <Button title="Zajemi obrok s kamero" onPress={pickImage} />
            )}

            {imageUri && (
                <Image source={{ uri: imageUri }} style={{ width: 300, height: 300, marginTop: 20, borderRadius: 10 }} />
            )}

            {loading && (
                <View style={{ marginTop: 20, alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="orange" />
                    <Text style={{ marginTop: 10 }}>Stiskanje in AI analiza...</Text>
                </View>
            )}

            {result && (
                <View style={{ marginTop: 30, alignItems: 'center', backgroundColor: '#f9f9f9', padding: 20, borderRadius: 15 }}>
                    <Text style={{ fontSize: 22, fontWeight: 'bold' }}>{result.name}</Text>
                    <Text style={{ fontSize: 18, color: 'gray' }}>🔥 {result.calories} kcal</Text>
                    <Text style={{ fontSize: 18, color: 'gray' }}>💪 {result.protein}g beljakovin</Text>

                    <View style={{ flexDirection: 'row', marginTop: 25 }}>
                        <Button
                            title="Shrani obrok"
                            onPress={() => navigation.navigate('Home', { email: userEmail })}
                        />
                        <View style={{ width: 20 }} />
                        <Button title="Izbriši" color="red" onPress={cancelObrok} />
                    </View>
                </View>
            )}
        </View>
    );
}