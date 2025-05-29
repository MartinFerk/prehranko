import React, { useRef, useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AuthButton from '../components/AuthButton';
import { theme } from '../styles/theme';
import { uploadFaceImagesForRegistration } from '../services/auth';

export default function CameraScreen({ navigation, route }) {
  const { email, onPhotoTaken } = route.params || {};
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);

  if (!permission) return <View />;
  if (permission.status !== 'granted') {
    return (
      <View style={styles.container}>
        <AuthButton title="Dovoli dostop do kamere" onPress={requestPermission} />
      </View>
    );
  }

  const takeFivePhotos = async () => {
    if (!cameraRef.current) {
      console.warn('⚠️ Kamera ni inicializirana.');
      return;
    }

    setLoading(true);

    try {
      const photoUris = [];

      for (let i = 0; i < 5; i++) {
        console.log(`📸 Zajem slike ${i + 1} ...`);
        const photo = await cameraRef.current.takePictureAsync();
        console.log(`✅ Slika ${i + 1} zajeta:`, photo.uri);
        photoUris.push(photo.uri);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 sekunda pavze
      }

      console.log('📤 Pošiljam slike na strežnik ...');
      const res = await uploadFaceImagesForRegistration(photoUris, email);
      console.log('✅ Odgovor strežnika:', res);

      Alert.alert('Uspeh', '5 slik uspešno shranjenih.');

      if (onPhotoTaken && typeof onPhotoTaken === 'function') {
        onPhotoTaken(); // Preusmeritev ali drugo dejanje
      }

    } catch (err) {
      Alert.alert('Napaka', err.message || 'Napaka pri pošiljanju slik.');
      console.error('❌ Napaka:', err);
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
          <AuthButton title="Zajemi 5 slik" onPress={takeFivePhotos} />
        )}
      </View>
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
});
