import { API_BASE_URL } from './api';

export const getAllObroki = async () => {
    const res = await fetch(`${API_BASE_URL}/obroki`);
    if (!res.ok) {
        throw new Error('Napaka pri pridobivanju obrokov');
    }
    return res.json();
};

export const getLastObrok = async () => {
  const res = await fetch(`${API_BASE_URL}/obroki/last`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('Napaka pri pridobivanju zadnjega obroka');
  }
  return res.json();
};