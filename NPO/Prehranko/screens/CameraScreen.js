import React, { useRef, useState } from 'react';
import { View, Image, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AuthButton from '../components/AuthButton';
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
    if (!cameraRef.current) return;

    setLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: false }); // base64 ni potreben tu
      setImage(photo.uri);

      await uploadFaceImage(photo.uri, email); // ⬅️ tvoja funkcija v /services/auth
         await fetch('https://prehranko-production.up.railway.app/api/auth/complete2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
      Alert.alert('✅ Obraz poslan v preverjanje');

      if (onPhotoTaken) onPhotoTaken(); // če imaš klic nazaj
    } catch (err) {
      console.error(err);
      Alert.alert('❌ Napaka', 'Ni uspelo zajeti ali poslati slike');
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
