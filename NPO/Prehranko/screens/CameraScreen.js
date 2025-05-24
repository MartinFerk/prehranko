import React, { useRef, useState } from 'react';
import { View, Button, StyleSheet, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function CameraScreen() {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [image, setImage] = useState(null);

  if (!permission) return <View />;
  if (permission.status !== 'granted') {
    return (
      <View>
        <Button title="Dovoli dostop do kamere" onPress={requestPermission} />
      </View>
    );
  }

 const takePhoto = async () => {
  if (cameraRef.current) {
    try {
      console.log("📸 Zajemam sliko ...");
      const photo = await cameraRef.current.takePictureAsync(); // <-- PRAVILNA METODA
      console.log("✅ Zajem uspel:", photo.uri);

      const formData = new FormData();
      formData.append('image', {
        uri: photo.uri,
        name: 'photo.jpg',
        type: 'image/jpg',
      });

      console.log("📤 Pošiljam sliko na strežnik ...");

      const res = await fetch('https://prehrankopython-production.up.railway.app/preprocess', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const json = await res.json();

      if (json.image_base64) {
        console.log("✅ Strežnik vrnil obdelano sliko.");
        setImage(`data:image/jpeg;base64,${json.image_base64}`);
      } else {
        console.warn("⚠️ Strežnik ni vrnil base64 slike:", json);
      }
    } catch (err) {
      console.error("❌ Napaka pri pošiljanju slike:", err);
    }
  } else {
    console.warn("⚠️ Kamera ni inicializirana.");
  }
};


  return (
    <View style={{ flex: 1 }}>
      <CameraView style={StyleSheet.absoluteFill} facing="front" ref={cameraRef} />
      <View style={styles.buttonContainer}>
        <Button title="Zajemi in pošlji" onPress={takePhoto} />
      </View>
      {image && (
        <Image
          source={{ uri: image }}
          style={{ width: 300, height: 300, alignSelf: 'center', marginTop: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
});
