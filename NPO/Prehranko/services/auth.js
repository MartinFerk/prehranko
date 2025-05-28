import { API_BASE_URL } from './api';
import { CAMERA_API_URL } from './api';
import * as FileSystem from 'expo-file-system';

export const loginUser = async (email, password) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, from: "app" }),
    });

    const data = await res.json();
    console.log('⬅️ Odgovor:', data);

    if (!res.ok) {
      throw new Error(data.message || 'Prijava ni uspela');
    }
    return data;
  } catch (err) {
    console.error('❌ Napaka pri prijavi:', err.message);
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
    console.error('❌ Napaka pri registraciji:', err.message);
    throw err;
  }
};

export const sendActivity = async (activityObject) => {
  try {
    const res = await fetch(`${API_BASE_URL}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activityObject),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Napaka pri pošiljanju aktivnosti');
    console.log('✅ Aktivnost poslana na strežnik');
    return data;
  } catch (err) {
    console.error('❌ Napaka pri pošiljanju aktivnosti:', err.message);
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
    console.error('❌ Napaka pri obdelavi slike:', err.message);
    throw err;
  }
};



export async function uploadFaceImages(imageUris, email) {
  const formData = new FormData();

  formData.append("email", email);
  imageUris.forEach((uri, index) => {
    const filename = uri.split('/').pop();
    formData.append("images", {
      uri,
      name: filename || `image${index + 1}.jpg`,
      type: "image/jpeg",
    });
  });

  const response = await fetch("https://prehrankopython-production.up.railway.app/register", {
    method: "POST",
    body: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Napaka pri registraciji obraza");
  return result;
}

