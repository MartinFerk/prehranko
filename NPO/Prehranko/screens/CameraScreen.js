import React, { useRef, useState } from 'react';
import { View, Image, StyleSheet, Alert, ActivityIndicator, Text } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AuthButton from '../components/AuthButton';
import { theme } from '../styles/theme';
import { uploadFaceImagesForRegistration } from '../services/auth';

export default function CameraScreen({ navigation, route }) {
  const { email, onPhotoTaken } = route.params || {};
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastImage, setLastImage] = useState(null);

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
      const photo = await cameraRef.current.takePictureAsync({ base64: false });
      const newImages = [...images, photo.uri];
      setImages(newImages);
      setLastImage(photo.uri);

      if (newImages.length === 5) {
        await uploadFaceImagesForRegistration(newImages, email);
        Alert.alert("✅ Registracija uspešna – značilke obraza shranjene");
        setImages([]);
        if (onPhotoTaken) onPhotoTaken();
      } else {
        Alert.alert("📸 Zajeta slika", `Zajeta ${newImages.length}/5`);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("❌ Napaka", "Ni uspelo zajeti ali poslati slike");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFill} facing="front" ref={cameraRef} />
      <View style={styles.overlay}>
        <Text style={styles.counterText}>Zajetih slik: {images.length} / 5</Text>
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} />
        ) : (
          <AuthButton title="Zajemi obraz" onPress={takePhoto} />
        )}
        {lastImage && (
          <Image source={{ uri: lastImage }} style={styles.previewImage} />
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
  overlay: {
    position: 'absolute',
    bottom: theme.spacing.large,
    alignSelf: 'center',
    alignItems: 'center',
  },
  counterText: {
    fontSize: 16,
    color: 'white',
    marginBottom: theme.spacing.small,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginTop: theme.spacing.medium,
  },
});
