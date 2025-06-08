import { useEffect } from 'react';
   import Mqtt from 'react-native-mqtt';
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
         const mqttClient = await Mqtt.connect('mqtt://prehrankomosquitto.railway.internal:1883', {
           clientId,
           clean: true,
           reconnect: true,
           keepalive: 60,
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
             if (data.pending2FA && data.from === 'web') {
               console.log('🔔 2FA zahteva iz spleta za', email, '— navigacija na FaceVerificationScreen');
               navigation.navigate('FaceVerificationScreen', { email });
             } else {
               console.log('ℹ️ 2FA zahteva ignorirana — ni prišla iz web:', data.from);
             }
           }
         });

         mqttClient.on('error', (err) => {
           console.error('❌ MQTT error:', err.message);
         });

         mqttClient.on('closed', () => {
           console.log('🔌 MQTT connection closed');
         });

         return () => {
           if (mqttClient) mqttClient.disconnect();
         };
       };

       connectMQTT();
     }, []);

     return null;
   };

   export default MQTTListener;