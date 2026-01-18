import { API_BASE_URL } from './api';

// Pridobi vse obroke za določenega uporabnika
export const getAllObroki = async (email) => {
    // Pot spremenjena v /images/all, vključen email query parameter
    const res = await fetch(`${API_BASE_URL}/images/all?email=${encodeURIComponent(email)}`);

    if (!res.ok) {
        throw new Error('Napaka pri pridobivanju obrokov');
    }
    return res.json();
};

// Pridobi vse obroke vseh uporabnikov (za zemljevid)
export const getFullObroki = async () => {
    const res = await fetch(`${API_BASE_URL}/images/full`);

    if (!res.ok) {
        throw new Error('Napaka pri pridobivanju vseh obrokov iz baze');
    }
    return res.json();
};

// Pridobi zadnji obrok za dashboard
export const getLastObrok = async () => {
    // Pot spremenjena v /images/last, da ustreza novemu backendu
    const res = await fetch(`${API_BASE_URL}/images/last`, {
        cache: 'no-store',
    });
    if (!res.ok) {
        throw new Error('Napaka pri pridobivanju zadnjega obroka');
    }
    return res.json();
};

// Odstranili smo podvojeno kodo getAllObroki, ki je bila tukaj spodaj