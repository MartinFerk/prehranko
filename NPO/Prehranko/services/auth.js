import { API_BASE_URL, CAMERA_API_URL } from './api';
import * as FileSystem from 'expo-file-system';

export const loginUser = async (email, password, deviceId, deviceName, clientId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        from: 'app',
        deviceId,
        deviceName,
        clientId,
      }),
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

export const logoutUser = async (email, deviceId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, deviceId }),
    });

    const data = await res.json();
    console.log('⬅️ Odgovor odjave:', data);

    if (!res.ok) {
      throw new Error(data.message || 'Odjava ni uspela');
    }
    return data;
  } catch (err) {
    console.error('❌ Napaka pri odjavi:', err.message);
    throw err;
  }
};

export const registerUser = async (username, email, password) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
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

export const check2FAStatus = async (email) => {
  try {
    const res = await fetch(`${API_BASE_URL}/2fa/status?email=${encodeURIComponent(email)}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Napaka pri preverjanju 2FA statusa');
    }
    return data;
  } catch (err) {
    console.error('❌ Napaka pri preverjanju 2FA:', err.message);
    throw err;
  }
};

export const complete2FA = async (email) => {
  try {
    const res = await fetch(`${API_BASE_URL}/2fa/complete-2fa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Napaka pri dokončanju 2FA');
    }
    return data;
  } catch (err) {
    console.error('❌ Napaka pri dokončanju 2FA:', err.message);
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

export const uploadFaceImage = async (uri, email) => {
  const formData = new FormData();
  formData.append('image', {
    uri,
    name: 'photo.jpg',
    type: 'image/jpeg',
  });
  formData.append('email', email);

  const res = await fetch(`${API_BASE_URL}/upload-face-image`, {
    method: 'POST',
    body: formData,
  });

  const text = await res.text();
  if (!res.ok) {
    console.error('❌ Server returned HTML or error text:', text.slice(0, 100));
    throw new Error('Strežnik vrnil napako: ' + text.slice(0, 100));
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error('❌ Strežnik ni vrnil veljavnega JSON. Dobil sem:\n' + text.slice(0, 100));
  }
};

export const uploadFaceImagesForRegistration = async (photoUris, email) => {
  try {
    const formData = new FormData();
    photoUris.forEach((uri, i) => {
      formData.append('images', {
        uri,
        name: `photo${i + 1}.jpg`,
        type: 'image/jpeg',
      });
    });
    formData.append('email', email);

    const res = await fetch(`${CAMERA_API_URL}/register`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Napaka pri registraciji obraznih značilk');
    }
    return data;
  } catch (err) {
    console.error('❌ Napaka pri nalaganju značilk:', err.message);
    throw err;
  }
};

export const saveFeaturesToBackend = async (email, features) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/save-features`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, features }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Napaka pri shranjevanju značilk');
    }
    return data;
  } catch (err) {
    console.error('❌ Napaka pri shranjevanju značilk:', err.message);
    throw err;
  }
};