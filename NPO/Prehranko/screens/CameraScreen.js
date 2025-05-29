// screens/CameraScreen.js
import React, { useRef, useState } from 'react';
import { View, Image, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AuthButton from '../components/AuthButton';
import { preprocessImage } from '../services/auth';
import { theme } from '../styles/theme';
import { uploadFaceImage } from '../services/auth';

import * as FileSystem from 'expo-file-system';

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

  const takeMultiplePhotos = async () => {
  if (!cameraRef.current) {
    console.warn('⚠️ Kamera ni inicializirana.');
    return;
  }

  setLoading(true);

  try {
    const photos = [];

    for (let i = 0; i < 5; i++) {
      console.log(`📸 Zajem slike ${i + 1}/5 ...`);
      const photo = await cameraRef.current.takePictureAsync({ base64: false });
      photos.push(photo);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    // 🔁 Pošlji vse slike Python strežniku
    const formData = new FormData();
    photos.forEach((photo, index) => {
      formData.append('images', {
        uri: photo.uri,
        name: `photo${index + 1}.jpg`,
        type: 'image/jpeg',
      });
    });

    const res = await fetch('http://<YOUR_PYTHON_SERVER_IP>:5000/extract-embeddings', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await res.json();

    if (!res.ok || !data.embeddings) {
      throw new Error('Napaka pri ekstrakciji značilk');
    }

    console.log('✅ Značilke pridobljene:', data.embeddings);

    // (Neobvezno) ➕ Pošlji slike in značilke v svoj Node strežnik
    const uploadResult = await fetch('http://<YOUR_NODE_SERVER>/api/save-embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        embeddings: data.embeddings,
      }),
    });

    const uploadResponse = await uploadResult.json();
    console.log('💾 Shramba na backend:', uploadResponse);

    Alert.alert('Uspeh', 'Značilke uspešno pridobljene in shranjene.');

    if (onPhotoTaken && typeof onPhotoTaken === 'function') {
      onPhotoTaken();
    }

  } catch (err) {
    Alert.alert('Napaka', err.message || 'Napaka pri procesiranju slik');
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
          <AuthButton title="Zajemi 5 slik" onPress={takeMultiplePhotos} />
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