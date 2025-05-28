import { API_BASE_URL } from './api';
import { CAMERA_API_URL } from './api';

export const verifyFaceImage = async (imageUri, email) => {
  const formData = new FormData();
  formData.append("email", email);
  formData.append("image", {
    uri: imageUri,
    name: "photo.jpg",
    type: "image/jpeg",
  });

  const response = await fetch(`${CAMERA_API_URL}/verify`, {
    method: "POST",
    body: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Napaka pri preverjanju obraza");
  return result;
};

export const trigger2FA = async (email) => {
  try {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/trigger2fa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || '2FA zahteva ni uspela');
    return data;
  } catch (err) {
    console.error('❌ Napaka pri trigger2FA:', err.message);
    throw err;
  }
};

