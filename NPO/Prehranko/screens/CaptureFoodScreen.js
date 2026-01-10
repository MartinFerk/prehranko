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

    const analyzeFoodImage = async (localUri) => {
        setLoading(true);
        setResult(null);

        try {
            // 1. Lokacija (tvoja stara logika)
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') throw new Error('Dovoljenje za lokacijo ni odobreno');
            const location = await Location.getCurrentPositionAsync({});

            // 2. PRIPRAVA PIKSLOV ZA DCT
            // Tvoja stara koda je brala Base64, mi pa rabimo surove piksle.
            // ImageManipulator nam pomanjša sliko na 512x512, da DCT ne traja celo večnost.
            const manipulated = await ImageManipulator.manipulateAsync(
                localUri,
                [{ resize: { width: 512, height: 512 } }],
                { format: 'png', base64: true }
            );

            // 3. DCT KOMPRESIJA (Tukaj se zgodi tvoja matematika)
            console.log("📦 Začenjam DCT kompresijo na frontendu...");

            // Ker React Native nima direktnega getPixels, uporabimo trik:
            // Base64 iz manipulated.base64 pretvorimo v Buffer, ki ga tvoj DCT razume kot piksle.
            const pixelBuffer = Buffer.from(manipulated.base64, 'base64');

            const compressedBinary = await compressImageDCT(pixelBuffer, 512, 512, 20);
            const base64DCT = Buffer.from(compressedBinary).toString('base64');

            // 4. POŠILJANJE NA BACKEND (Brez Imgurja!)
            const obrokId = uuid.v4();
            const response = await fetch(`${API_BASE_URL}/images/uploadimg`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    obrokId,
                    userEmail,
                    compressedData: base64DCT, // Pošljemo DCT stisnjene podatke
                    locX: location.coords.longitude,
                    locY: location.coords.latitude,
                    width: 512,
                    height: 512
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Napaka na strežniku');

            setResult(data.obrok);
        } catch (err) {
            console.error('Napaka:', err.message);
            Alert.alert('Napaka', err.message);
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