import React, { useRef, useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AuthButton from '../components/AuthButton';
import { uploadFaceImagesForRegistration, saveFeaturesToBackend } from '../services/auth';
import { theme } from '../styles/theme';

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
    if (!cameraRef.current) return;
    setLoading(true);
    try {
      const uris = [];
      for (let i = 0; i < 3; i++) {
        const photo = await cameraRef.current.takePictureAsync();
        uris.push(photo.uri);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      const result = await uploadFaceImagesForRegistration(uris, email);
      await saveFeaturesToBackend(email, result.features);
      Alert.alert('Uspeh', 'Značilke uspešno shranjene.');
      if (onPhotoTaken) onPhotoTaken();
    } catch (err) {
      Alert.alert('Napaka', err.message || 'Napaka pri registraciji.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFill} facing="front" ref={cameraRef} />
      <View style={styles.buttonContainer}>
        {loading ? <ActivityIndicator size="large" color={theme.colors.primary} /> : (
          <AuthButton title="Zajemi 3 slike" onPress={takeFivePhotos} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  buttonContainer: { position: 'absolute', bottom: theme.spacing.large, alignSelf: 'center' },
});
