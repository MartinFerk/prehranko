import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { v4 as uuidv4 } from 'uuid';
import { sendActivity } from '../services/auth'; // ali pot do tvoje API datoteke


export default function ActivityScreen({ route }) {
    const { email } = route.params || {};
    const [data, setData] = useState([]);
    const [isRecording, setIsRecording] = useState(false);

    useEffect(() => {
        console.log('✅ ActivityScreen loaded');
        console.log('📧 Prejet email:', email);
    }, []);

    const startRecording = () => {
        console.log('▶️ Začetek snemanja MOCK aktivnosti...');
        setIsRecording(true);

        const collected = [];
        const activityId = simpleId(); // <- custom safe ID

        function generateMockLocation() {
            const offsetLat = (Math.random() - 0.5) * 0.0018;
            const offsetLon = (Math.random() - 0.5) * 0.0018;
            return {
                latitude: 46.5387 + offsetLat,
                longitude: 15.5127 + offsetLon,
            };
        }

        function generateMockAccel() {
            return {
                x: (Math.random() * 0.5).toFixed(3),
                y: (Math.random() * 0.5).toFixed(3),
                z: (Math.random() * 0.5).toFixed(3),
            };
        }

        for (let i = 0; i < 5; i++) {
            const mockCoords = generateMockLocation();
            const mockAccel = generateMockAccel();

            const entry = {
                activityId,
                email,
                timestamp: new Date().toISOString(),
                stats: {
                    coords: mockCoords,
                    accel: mockAccel,
                },
            };

            console.log(`🧪 MOCK točka ${i + 1}:`, JSON.stringify(entry));
            collected.push(entry);
        }

        const path = FileSystem.documentDirectory + 'data.json';
        const jsonString = JSON.stringify(collected, null, 2);

        FileSystem.writeAsStringAsync(path, jsonString)
            .then(() => {
                console.log('✔️ Podatki shranjeni v:', path);
                setData(collected);
                setIsRecording(false);
                console.log('⏹️ Snemanje končano');

                sendActivity({
                    activityId,
                    userEmail: email,
                    stats: collected.map(entry => ({
                        coords: entry.stats.coords,
                        accel: entry.stats.accel,
                        timestamp: entry.timestamp,
                    }))
                })
                    .then(() => console.log('📤 Aktivnost poslana na strežnik'))
                    .catch(err => console.error('❌ Pošiljanje spodletelo:', err.message));
            })
            .catch(err => {
                console.error('❌ Napaka pri shranjevanju:', err.message);
                setIsRecording(false);
            });

    };

// UUID alternativa
    function simpleId() {
        return 'xxxxxxxxyxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            return r.toString(16);
        });
    }


    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Sledenje aktivnosti</Text>

            <Button
                title={isRecording ? "Beleženje..." : "Začni beleženje"}
                onPress={startRecording}
                disabled={isRecording}
            />

            <Text style={styles.subtitle}>Zabeleženih točk: {data.length}</Text>

            {data.map((item, index) => (
                <View key={index} style={styles.entry}>
                    <Text>{index + 1}. 🕒 {item.timestamp}</Text>
                    <Text>📍 Lokacija: {item.stats.coords.latitude}, {item.stats.coords.longitude}</Text>
                    <Text>📈 Pospešek: x={item.stats.accel.x}, y={item.stats.accel.y}, z={item.stats.accel.z}</Text>
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    subtitle: { marginTop: 20, fontSize: 16 },
    entry: {
        marginVertical: 10,
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
    },
});