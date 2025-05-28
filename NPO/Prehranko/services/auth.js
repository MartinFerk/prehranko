// services/auth.js
import { Alert } from 'react-native';
import { API_BASE_URL } from './api';
import { CAMERA_API_URL } from './api';
import { publishActivityMQTT } from './mqtt'; // ✅ Correct import

export const loginUser = async (email, password) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    console.log('⬅️ Odgovor:', data);
    if (!res.ok) {
      throw new Error(data.message || 'Prijava ni uspela');
    }
    return data;
  } catch (err) {
    console.error('❌ Napaka:', err);
    throw err;
  }
};

export const registerUser = async (email, password) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Registracija ni uspela');
    }
    return data;
  } catch (err) {
    console.error('❌ Napaka:', err);
    throw err;
  }
};

export const sendActivity = async (activityObject) => {
  try {
    publishActivityMQTT(activityObject); // 🟢 Send via MQTT
    console.log('📤 Aktivnost poslana preko MQTT');
  } catch (e) {
    console.warn('⚠️ MQTT ni uspel:', e.message);
  }

  try {
    const res = await fetch(`${API_BASE_URL}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activityObject),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Napaka pri pošiljanju aktivnosti (HTTP)');
    console.log('✅ Aktivnost poslana (HTTP fallback)');
    return data;
  } catch (err) {
    console.error('❌ Napaka pri HTTP pošiljanju aktivnosti:', err.message);
    throw err;
  }
};

export const preprocessImage = async (photoUri) => {
  try {
    const formData = new FormData();
    formData.append('image', {
      uri: photoUri,
      name: 'photo.jpg',
      type: 'image/jpg',
    });

    console.log('📤 Pošiljam sliko na strežnik ...');
    const res = await fetch(`${CAMERA_API_URL}/preprocess`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Obdelava slike ni uspela');
    }
    return data;
  } catch (err) {
    console.error('❌ Napaka pri pošiljanju slike:', err);
    throw err;
  }
};

export const uploadFaceImage = async (photoUri, email) => {
  try {
    const formData = new FormData();
    formData.append('image', {
      uri: photoUri,
      name: `${email}_2fa.jpg`,
      type: 'image/jpeg',
    });
    formData.append('email', email);

    console.log('📤 Pošiljam 2FA sliko na strežnik ...');
    const res = await fetch(`${API_BASE_URL}/upload-face-image`, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Nalaganje slike ni uspelo');
    }
    return data;
  } catch (err) {
    console.error('❌ Napaka pri nalaganju slike:', err);
    throw err;
  }
};
