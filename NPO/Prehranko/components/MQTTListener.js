// src/components/MQTTListener.js
import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';
import MQTT from 'react-native-mqtt';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MQTT_URL = 'mqtt://prehrankomosquitto.railway.internal:1883';

export default function MQTTListener() {
  const navigation = useNavigation();

  useEffect(() => {
    const fetchEmailAndConnect = async () => {
      try {
        const userEmail = await AsyncStorage.getItem('userEmail');
        if (!userEmail) {
          console.log('ℹ️ Ni shranjenega emaila za MQTT povezavo.');
          return;
        }

        const clientId = `client_${Math.random().toString(16).slice(3)}`;
        const client = new MQTT.Client(MQTT_URL, clientId);

        client.on('connect', () => {
          console.log('✅ Povezan z MQTT strežnikom');
          client.subscribe(`2fa/request/${userEmail}`, (err) => {
            if (err) console.error('❌ Napaka pri naročanju na 2FA temo:', err);
            else console.log(`📬 Naročen na 2fa/request/${userEmail}`);
          });
        });

        client.on('message', (topic, message) => {
          try {
            const data = JSON.parse(message.toString());
            console.log('📨 Prejeto MQTT sporočilo:', data);

            if (data.email === userEmail && data.pending2FA) {
              Alert.alert(
                '🔐 2FA preverjanje',
                'Odpri kamero in preveri obraz.',
                [
                  {
                    text: 'Začni',
                    onPress: () => navigation.navigate('FaceVerificationScreen', { email: userEmail }),
                  },
                  { text: 'Prekliči', style: 'cancel' },
                ]
              );
            }
          } catch (err) {
            console.error('❌ Napaka pri obdelavi MQTT sporočila:', err.message);
          }
        });

        client.on('error', (err) => {
          console.error('❌ MQTT napaka:', err);
        });

        client.connect();

        return () => {
          client.disconnect();
        };
      } catch (err) {
        console.error('❌ Napaka pri branju emaila:', err.message);
      }
    };

    fetchEmailAndConnect();
  }, []);

  return null; // Komponenta ne renderira ničesar
}