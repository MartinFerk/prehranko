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



router.post('/upload-face-image', upload.array('images', 5), async (req, res) => {
  const { email } = req.body;
  const files = req.files;

  if (!email || !files || files.length < 3) {
    return res.status(400).json({ message: 'Potrebne so vsaj 3 slike in email' });
  }

  const form = new FormData();
  form.append('email', email);
  files.forEach((file) => {
    form.append('images', fs.createReadStream(file.path));
  });

  try {
    const response = await axios.post('https://prehranko-production.up.railway.app/api/register-face', form, {
      headers: form.getHeaders(),
    });

    files.forEach((f) => fs.unlinkSync(f.path));

    if (response.data.success) {
      return res.json({ message: 'Uspeh', result: response.data });
    } else {
      return res.status(400).json({ message: response.data.message || 'Napaka v prepoznavi obraza' });
    }
  } catch (err) {
    console.error('❌ Napaka pri povezavi na Python strežnik:', err.message);
    return res.status(500).json({ message: 'Napaka pri komunikaciji s prepoznavo obraza' });
  }
});
export const uploadFaceImagesForRegistration = async (images, email) => {
  const formData = new FormData();

  formData.append("email", email);
  images.forEach((uri, index) => {
    formData.append("images", {
      uri,
      name: `face${index + 1}.jpg`,
      type: "image/jpeg",
    });
  });

  const res = await fetch('https://prehranko-production.up.railway.app/api/auth/register-face', {
    method: 'POST',
    body: formData,
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error("Napaka pri registraciji obraznih značilk: " + text.slice(0, 100));
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error("Strežnik ni vrnil veljavnega JSON odgovora. Prejeto: " + text.slice(0, 100));
  }
};



