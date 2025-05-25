// screens/CameraScreen.js
import React, { useRef, useState } from 'react';
import { View, Image, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AuthButton from '../components/AuthButton';
import { preprocessImage } from '../services/auth';
import { theme } from '../styles/theme';

export default function CameraScreen({ navigation, route }) {
  const { email } = route.params || { email: 'Uporabnik' };
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!permission) return <View />;
  if (permission.status !== 'granted') {
    return (
      <View style={styles.container}>
        <AuthButton title="Dovoli dostop do kamere" onPress={requestPermission} />
      </View>
    );
  }

  const takePhoto = async () => {
    if (cameraRef.current) {
      setLoading(true);
      try {
        console.log('📸 Zajemam sliko ...');
        const photo = await cameraRef.current.takePictureAsync();
        console.log('✅ Zajem uspel:', photo.uri);

        const data = await preprocessImage(photo.uri);

        if (data.image_base64) {
          console.log('✅ Strežnik vrnil obdelano sliko.');
          setImage(`data:image/png;base64,${data.image_base64}`);
        }

        if (data.authorized === true) {
          Alert.alert('Preverjanje uspešno', 'Obraz je bil prepoznan.');
          navigation.navigate('Home', { email }); // Vrnitev na HomeScreen
        } else {
          Alert.alert('Preverjanje neuspešno', 'Obraz ni prepoznan. Poskusi znova.');
        }
      } catch (err) {
        Alert.alert('Napaka', err.message || 'Napaka pri preverjanju identitete.');
        console.error('❌ Napaka:', err);
      } finally {
        setLoading(false);
      }
    } else {
      console.warn('⚠️ Kamera ni inicializirana.');
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFill} facing="front" ref={cameraRef} />
      <View style={styles.buttonContainer}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} />
        ) : (
          <AuthButton title="Zajemi in pošlji" onPress={takePhoto} />
        )}
      </View>
      {image && (
        <Image
          source={{ uri: image }}
          style={styles.image}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: theme.spacing.large,
    alignSelf: 'center',
  },
  image: {
    width: 300,
    height: 300,
    alignSelf: 'center',
    marginTop: theme.spacing.large,
  },
});