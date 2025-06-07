import { API_BASE_URL } from './api';
import { CAMERA_API_URL } from './api';

// ⏺️ Verify face on mobile (image upload)
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

// ✅ Sproži 2FA na strežniku
export const trigger2FA = async (email) => {
  const res = await fetch(`${API_BASE_URL}/auth/trigger2fa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || 'Napaka pri sprožitvi 2FA');
  }

  return res.json();
};

// ✅ Registracija uporabnika
export const registerUser = async (email, password) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error("Strežnik ni vrnil veljavnega JSON (morda napačen endpoint?)");
    }

    if (!res.ok) throw new Error(data.message || "Napaka pri registraciji");
    return data;
  } catch (err) {
    throw err;
  }
};

// ✅ Prijava uporabnika (prvi del, brez 2FA potrditve)
export const loginUser = async (email, password) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, from: "web" }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error("❌ Strežnik ni vrnil veljavnega JSON (verjetno napaka 500 ali napačen URL)");
    }

    if (!res.ok) throw new Error(data.message || "Napaka pri prijavi");
    return data;
  } catch (err) {
    console.error("❌ Napaka pri loginu:", err.message);
    throw err;
  }
};

// ✅ NOVO: pridobi podatke po uspešni 2FA
export const finishLogin = async (email) => {
  const res = await fetch(`${API_BASE_URL}/auth/finish-login?email=${encodeURIComponent(email)}`);

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("❌ Strežnik ni vrnil veljavnega JSON");
  }

  if (!res.ok) throw new Error(data.message || "Napaka pri končnem prijavljanju");
  return data;
};
