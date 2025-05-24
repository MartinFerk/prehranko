// services/auth.js
import { Alert } from 'react-native';
import { API_BASE_URL } from './api';

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