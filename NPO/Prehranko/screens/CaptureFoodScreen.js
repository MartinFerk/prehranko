import React, { useState, useRef } from 'react';
import { View, Text, Button, Image, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as ImageManipulator from 'expo-image-manipulator';
import { GLView } from 'expo-gl';
import Expo2DContext from 'expo-2d-context';
import uuid from 'react-native-uuid';
import { Buffer } from 'buffer';

import { API_BASE_URL } from '../services/api';
import { compressImageDCT } from '../utils/compression';

export default function CaptureFoodScreen({ navigation, route }) {
    const userEmail = route.params?.email;
    const [imageUri, setImageUri] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const contextRef = useRef(null);

    const onContextCreate = (gl) => {
        const ctx = new Expo2DContext(gl, { renderWithCorrectColors: true });
        contextRef.current = ctx;
        console.log("🎨 Canvas pripravljen.");
    };

    const pickImage = async () => {
        const pickerResult = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!pickerResult.canceled && pickerResult.assets?.length > 0) {
            const pickedUri = pickerResult.assets[0].uri;
            setImageUri(pickedUri);
            analyzeFoodImage(pickedUri);
        }
    };

    const analyzeFoodImage = async (localUri) => {
        if (!contextRef.current) {
            Alert.alert("Napaka", "Sistem za obdelavo slike se še nalaga.");
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            // A) Lokacija
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') throw new Error('Dovoljenje za lokacijo ni odobreno.');
            const location = await Location.getCurrentPositionAsync({});
            const { longitude: locX, latitude: locY } = location.coords;

            // B) Resize na 512x512
            console.log('🖼️ Resize slike...');
            const manipulated = await ImageManipulator.manipulateAsync(
                localUri,
                [{ resize: { width: 512, height: 512 } }],
                { format: 'png' }
            );

            // C) Branje pikslov preko Canvasa
            console.log('🎨 Priprava pikslov...');
            const ctx = contextRef.current;

            const pixelData = await new Promise((resolve, reject) => {
                const img = new global.Image();
                img.onload = () => {
                    try {
                        ctx.clearRect(0, 0, 512, 512);
                        ctx.drawImage(img, 0, 0, 512, 512);
                        ctx.flush();
                        const imageData = ctx.getImageData(0, 0, 512, 512);
                        resolve(imageData.data);
                    } catch (e) { reject(e); }
                };
                img.onerror = () => reject(new Error("Napaka pri nalaganju slike v Canvas."));
                img.src = manipulated.uri;
            });

            // D) DCT Kompresija (Prejšnji delujoč proces)
            console.log('📦 DCT Kompresija...');
            const compressedBinary = await compressImageDCT(pixelData, 512, 512, 20);
            const base64Data = Buffer.from(compressedBinary).toString('base64');

            // E) Pošiljanje na Backend
            const obrokId = uuid.v4();
            console.log('📡 Pošiljanje podatkov...');

            const response = await fetch(`${API_BASE_URL}/images/uploadimg`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    obrokId,
                    userEmail,
                    compressedData: base64Data,
                    locX, locY,
                    width: 512, height: 512,
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Server Error');

            setResult(data.obrok);

        } catch (err) {
            console.error(err);
            Alert.alert('Napaka', err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={{ height: 0, width: 0, opacity: 0, position: 'absolute' }}>
                <GLView
                    style={{ width: 512, height: 512 }}
                    onContextCreate={onContextCreate}
                />
            </View>

            {!result && !loading && (
                <View style={styles.buttonContainer}>
                    <Button title="Zajemi obrok s kamero" color="#FF8C00" onPress={pickImage} />
                </View>
            )}

            {imageUri && !result && (
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
            )}

            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF8C00" />
                    <Text style={styles.loadingText}>Analiza obroka ...</Text>
                </View>
            )}

            {result && (
                <View style={styles.resultCard}>
                    <Text style={styles.foodName}>{result.name}</Text>
                    <Text style={styles.stats}>🔥 {result.calories} kcal | 💪 {result.protein}g P</Text>
                    <Button title="V redu" color="#28a745" onPress={() => navigation.navigate('Home', { email: userEmail })} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    buttonContainer: { width: '80%' },
    previewImage: { width: 300, height: 300, marginTop: 20, borderRadius: 15 },
    loadingContainer: { marginTop: 20, alignItems: 'center' },
    loadingText: { marginTop: 10, fontWeight: 'bold' },
    resultCard: { padding: 25, backgroundColor: '#fdfdfd', borderRadius: 20, elevation: 8, alignItems: 'center' },
    foodName: { fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
    stats: { fontSize: 18, color: '#666', marginBottom: 20 }
});