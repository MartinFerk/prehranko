import React, { useState } from 'react';
import { View, Text, Button, Image, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';
import * as ImageManipulator from 'expo-image-manipulator';
import uuid from 'react-native-uuid';
import { Buffer } from 'buffer';

import { API_BASE_URL } from '../services/api';
import { compressImageDCT } from '../utils/compression'; // Tvoja DCT funkcija

export default function CaptureFoodScreen({ navigation, route }) {
    const userEmail = route.params?.email;
    const [imageUri, setImageUri] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const pickImage = async () => {
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled && result.assets?.length > 0) {
            const pickedUri = result.assets[0].uri;
            setImageUri(pickedUri);
            analyzeFoodImage(pickedUri);
        }
    };

    import { decode as decodeJpeg } from 'jpeg-js'; // To nujno potrebuješ za piksle

    const analyzeFoodImage = async (localUri) => {
        setLoading(true);
        setResult(null);
        const startTime = Date.now();

        try {
            console.log("--- 🚀 Začetek analize obroka ---");

            // 1. LOKACIJA
            console.log("📍 Pridobivam lokacijo...");
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') throw new Error('Dovoljenje za lokacijo ni odobreno');
            const location = await Location.getCurrentPositionAsync({});
            console.log(`✅ Lokacija pridobljena: ${location.coords.latitude}, ${location.coords.longitude}`);

            // 2. MANIPULACIJA SLIKE (Resize na 512x512)
            console.log("🖼️ Pripravljam sliko (resize na 512x512)...");
            const manipResult = await ImageManipulator.manipulateAsync(
                localUri,
                [{ resize: { width: 512, height: 512 } }],
                { format: 'jpeg', quality: 0.8, base64: true }
            );
            console.log(`✅ Slika pripravljena. Velikost JPEG Base64: ${(manipResult.base64.length / 1024).toFixed(2)} KB`);

            // 3. DEKODIRANJE JPEG -> RAW PIKSLI
            console.log("🔓 Dekodiram JPEG v surove piksle (RGB)...");
            const buffer = Buffer.from(manipResult.base64, 'base64');
            const decoded = decodeJpeg(buffer, { useTArray: true });
            const pixels = decoded.data; // Uint8Array [R, G, B, A, ...]
            console.log(`✅ Piksli pripravljeni. Skupaj bajtov: ${pixels.length}`);

            // 4. DCT KOMPRESIJA (Tvoj algoritem)
            console.log("📦 Začenjam DCT kompresijo na napravi...");
            const dctStart = Date.now();
            const compressedBinary = await compressImageDCT(pixels, 512, 512, 20);
            const dctEnd = Date.now();

            const base64DCT = Buffer.from(compressedBinary).toString('base64');
            console.log(`✅ DCT končan v ${dctEnd - dctStart}ms.`);
            console.log(`📊 Velikost DCT paketa za prenos: ${(base64DCT.length / 1024).toFixed(2)} KB`);

            // 5. POŠILJANJE NA BACKEND
            console.log("📡 Pošiljam DCT podatke na backend...");
            const obrokId = uuid.v4();
            const response = await fetch(`${API_BASE_URL}/images/uploadimg`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    obrokId,
                    userEmail,
                    compressedData: base64DCT,
                    width: 512,
                    height: 512,
                    locX: location.coords.longitude,
                    locY: location.coords.latitude,
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Backend napaka');

            console.log("✨ Backend uspešno obdelal DCT in vrnil rezultat!");
            console.log(`⏱️ Celoten proces končan v ${(Date.now() - startTime) / 1000}s`);

            setResult(data.obrok);
        } catch (err) {
            console.error('❌ NAPAKA v analyzeFoodImage:', err.message);
            Alert.alert('Napaka pri obdelavi', err.message);
        } finally {
            setLoading(false);
        }
    };
    return (
        <View style={styles.container}>
            <Button title="Zajemi obrok" onPress={pickImage} color="orange" />

            {imageUri && !result && (
                <Image source={{ uri: imageUri }} style={styles.preview} />
            )}

            {loading && <ActivityIndicator size="large" color="orange" style={{ marginTop: 20 }} />}

            {result && (
                <View style={styles.resultCard}>
                    <Text style={styles.name}>{result.name}</Text>
                    <Text>{result.calories} kcal | {result.protein}g P</Text>
                    <Button title="Shrani" onPress={() => navigation.navigate('Home', { email: userEmail })} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' },
    preview: { width: 300, height: 300, marginTop: 20, borderRadius: 10 },
    resultCard: { marginTop: 20, alignItems: 'center', padding: 20, backgroundColor: '#f0f0f0', borderRadius: 10 }
});