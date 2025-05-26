// screens/CameraScreen.js
import React, { useRef, useState } from 'react';
import { View, Image, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AuthButton from '../components/AuthButton';
import { preprocessImage } from '../services/auth';
import { theme } from '../styles/theme';
import { uploadFaceImage } from '../services/auth';

export default function CameraScreen({ navigation, route }) {
  const { email, onPhotoTaken } = route.params || {};
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
  if (!cameraRef.current) {
    console.warn('⚠️ Kamera ni inicializirana.');
    return;
  }

  setLoading(true);

  try {
    console.log('📸 Zajemam sliko ...');
    const photo = await cameraRef.current.takePictureAsync();
    console.log('✅ Zajem uspel:', photo.uri);

    // 1. Pošlji sliko na strežnik (shrani v bazo / disk)
    const uploadResult = await uploadFaceImage(photo.uri, email);
    console.log('📤 Strežnik odgovoril:', uploadResult);

    Alert.alert('Uspeh', 'Slika je bila uspešno shranjena.');

    // 2. Pokliči funkcijo iz RegisterScreen, če obstaja
    if (onPhotoTaken) onPhotoTaken();

    // 3. Vrni se na prejšnji zaslon
    navigation.goBack();

  } catch (err) {
    Alert.alert('Napaka', err.message || 'Napaka pri pošiljanju slike');
    console.error('❌ Napaka pri slikanju ali nalaganju:', err);
  } finally {
    setLoading(false);
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