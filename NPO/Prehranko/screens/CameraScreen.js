// screens/CameraScreen.js
import React, { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AuthButton from '../components/AuthButton';
import { theme } from '../styles/theme';
import * as ImageManipulator from 'expo-image-manipulator';
import { API_BASE_URL } from '../services/api'; 

export default function CameraScreen({ navigation, route }) {
  const { email, mode = 'register' } = route.params || {};
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

  const compressPhoto = async (photo) => {
    const result = await ImageManipulator.manipulateAsync(
      photo.uri,
      [{ resize: { width: 400 } }],
      { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result;
  };

  const takeMultiplePhotos = async () => {
    if (!cameraRef.current) return;
    setLoading(true);

    try {
      const photos = [];

      for (let i = 0; i < 5; i++) {
        const photo = await cameraRef.current.takePictureAsync({ base64: false });
        const compressed = await compressPhoto(photo);
        photos.push(compressed);
        await new Promise(res => setTimeout(res, 800));
      }

      const formData = new FormData();
      photos.forEach((photo, index) => {
        formData.append('images', {
          uri: photo.uri,
          name: `photo${index + 1}.jpg`,
          type: 'image/jpeg',
        });
      });

      const res = await fetch('https://prehrankopython-production.up.railway.app/extract-embeddings', {
        method: 'POST',
        body: formData,
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        throw new Error('Strežnik ni vrnil veljavnega JSON');
      }

      if (!data.embeddings) {
        throw new Error('JSON nima polja "embeddings"');
      }

      const upload = await fetch('https://prehranko-production.up.railway.app/api/save-embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, embeddings: data.embeddings }),
      });

      const uploadResult = await upload.json();
      console.log('💾 Rezultat shranjevanja:', uploadResult);

      Alert.alert('Uspeh', 'Značilke uspešno pridobljene in shranjene.');
    } catch (err) {
      console.error('❌ Napaka:', err);
      Alert.alert('Napaka', err.message || 'Napaka pri pridobivanju značilk');
    } finally {
      setLoading(false);
    }
  };

  const takeSingleVerificationPhoto = async () => {
    if (!cameraRef.current) return;
    setLoading(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: false });
      const compressed = await compressPhoto(photo);

      const formData = new FormData();
      formData.append('image', {
        uri: compressed.uri,
        name: 'verify.jpg',
        type: 'image/jpeg',
      });

      const res = await fetch('https://prehrankopython-production.up.railway.app/verify-face', {
        method: 'POST',
        body: formData,
      });

      const text = await res.text();
      const data = JSON.parse(text);

      if (data.success) {
        Alert.alert('✅ Preverjanje uspešno!');
        // Označi 2FA kot opravljeno
        await fetch(`${API_BASE_URL}/auth/complete-2fa`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
      } else {
        Alert.alert('❌ Obraz se ne ujema.');
      }

      navigation.goBack();
    } catch (err) {
      console.error('❌ Napaka:', err);
      Alert.alert('Napaka pri preverjanju', err.message || 'Napaka pri pošiljanju slike');
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
          <AuthButton
            title={mode === 'verify' ? 'Preveri obraz' : 'Zajemi 5 slik'}
            onPress={mode === 'verify' ? takeSingleVerificationPhoto : takeMultiplePhotos}
          />
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
