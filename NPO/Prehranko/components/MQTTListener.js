import { useEffect } from 'react';
import mqtt from 'mqtt';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const MQTTListener = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const connectMQTT = async () => {
      const email = await AsyncStorage.getItem('userEmail');
      if (!email) {
        console.warn('ℹ Ni shranjenega emaila za MQTT povezavo');
        return;
      }

      const clientId = `mobile_${Math.random().toString(16).slice(2, 8)}`;
      const mqttClient = mqtt.connect('mqtt://prehrankomosquitto.railway.internal:1883', {
        clientId,
        clean: true,
        reconnectPeriod: 5000,
      });

      mqttClient.on('connect', () => {
        console.log('✅ MQTT client connected');
        mqttClient.subscribe(`2fa/request/${email}`, (err) => {
          if (err) {
            console.error('❌ Subscription error:', err.message);
          } else {
            console.log(`📬 Subscribed to 2fa/request/${email}`);
          }
        });
      });

      mqttClient.on('message', (topic, message) => {
        console.log(`📨 Received on ${topic}:`, message.toString());
        if (topic === `2fa/request/${email}`) {
          const data = JSON.parse(message.toString());
          if (data.pending2FA) {
            console.log('🔔 2FA zahteva za', email, 'sprožena, navigacija na FaceVerificationScreen');
            navigation.navigate('FaceVerificationScreen', { email });
          }
        }
      });

      mqttClient.on('error', (err) => {
        console.error('❌ MQTT error:', err.message);
      });

      mqttClient.on('close', () => {
        console.log('🔌 MQTT connection closed');
      });

      return () => {
        if (mqttClient) mqttClient.end();
      };
    };

    connectMQTT();
  }, []);

  return null;
};

export default MQTTListener;