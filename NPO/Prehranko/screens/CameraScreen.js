// screens/CameraScreen.js
import React, { useRef, useState } from 'react';
import { View, Image, StyleSheet, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AuthButton from '../components/AuthButton';
import { preprocessImage } from '../services/auth';
import { theme } from '../styles/theme';

export default function CameraScreen({ navigation }) {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [image, setImage] = useState(null);

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
          Alert.alert('2FA uspešna', 'Dostop dovoljen');
          navigation.navigate('Home');
        } else {
          Alert.alert('2FA neuspešna', 'Obraz ni prepoznan. Poskusi znova.');
        }
      } catch (err) {
        Alert.alert('Napaka', 'Napaka pri preverjanju identitete.');
        console.error('❌ Napaka:', err);
      }
    } else {
      console.warn('⚠️ Kamera ni inicializirana.');
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFill} facing="front" ref={cameraRef} />
      <View style={styles.buttonContainer}>
        <AuthButton title="Zajemi in pošlji" onPress={takePhoto} />
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