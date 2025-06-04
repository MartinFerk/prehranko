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

const handleLogin = async () => {
  setLoading(true);
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, from: "web" }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Napaka pri prijavi');

    await trigger2FA(email);
    alert('✅ Prijava uspešna. Počakaj na preverjanje obraza na telefonu.');

    // 🔁 Začni polling preverjanja 2FA statusa
    const checkInterval = setInterval(async () => {
      const statusRes = await fetch(`${API_BASE_URL}/auth/check-2fa?email=${email}`);
      const statusData = await statusRes.json();

      if (statusData.is2faVerified) {
        clearInterval(checkInterval);
        localStorage.setItem('loggedIn', 'true');
        navigate('/dashboard'); // 🔁 preusmeri na glavno stran
      }
    }, 3000); // vsakih 3 sekunde

  } catch (err) {
    alert('❌ ' + err.message);
  } finally {
    setLoading(false);
  }
};


export const registerUser = async (email, password) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    // ⛔ tukaj je pogosto napaka
    let data;
    try {
      data = await res.json();  // to fail-a, če backend vrne HTML
    } catch {
      throw new Error("Strežnik ni vrnil veljavnega JSON (morda napačen endpoint?)");
    }

    if (!res.ok) throw new Error(data.message || "Napaka pri registraciji");
    return data;
  } catch (err) {
    throw err;
  }
};


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

