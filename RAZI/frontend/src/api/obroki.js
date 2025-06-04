import { API_BASE_URL } from './api';

export const getAllObroki = async () => {
    const res = await fetch(`${API_BASE_URL}/obroki`);
    if (!res.ok) {
        throw new Error('Napaka pri pridobivanju obrokov');
    }
    return res.json();
};
