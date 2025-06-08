import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import '../styles.css';
import { getAllObroki } from '../api/obroki';
import { getUserByEmail } from '../api/auth';
import L from 'leaflet';

const goldMarkerIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const Home = () => {
    const [obroki, setObroki] = useState([]);
    const [showMineOnly, setShowMineOnly] = useState(false);
    const [userName, setUserName] = useState('');
    const navigate = useNavigate();
    const [zadnjiObrok, setZadnjiObrok] = useState(''); //Za latest obrok prek mqtt

    const userEmail = localStorage.getItem('userEmail');
    const isLoggedIn = localStorage.getItem('loggedIn') === 'true';

    // Preveri prijavo in pridobi ime uporabnika
    useEffect(() => {
        if (!isLoggedIn || !userEmail) {
            alert('⚠️ Nisi prijavljen – preusmerjam na prijavo.');
            navigate('/login');
            return;
        }

        const fetchUserName = async () => {
            try {
                const data = await getUserByEmail(userEmail);
                setUserName(data.user.username || 'Uporabnik');
            } catch (err) {
                console.error("❌ Napaka pri pridobivanju uporabniškega imena:", err);
                setUserName('Uporabnik');
            }
        };

        fetchUserName();
    }, [isLoggedIn, userEmail, navigate]);

    // Naloži obroke
    useEffect(() => {
        const fetchObroki = async () => {
            try {
                const data = await getAllObroki();
                const validObroki = data.filter(
                    (o) => !isNaN(parseFloat(o.locY)) && !isNaN(parseFloat(o.locX))
                );
                setObroki(validObroki);
            } catch (err) {
                console.error('❌ Napaka pri pridobivanju obrokov:', err);
            }
        };

        fetchObroki();
    }, []);

    useEffect(() => {
    const fetchZadnjiObrok = async () => {
        try {
            const res = await fetch('/api/obroki/last');
            const data = await res.json();
            console.log("📡 Fetch zadnjega obroka:", data.obrok);
            setZadnjiObrok(data.obrok);
        } catch (err) {
            console.error("Napaka pri nalaganju zadnjega obroka:", err);
        }
    };
        fetchZadnjiObrok(); // prvič
        const interval = setInterval(fetchZadnjiObrok, 5000); // nato vsakih 5s
        return () => clearInterval(interval); // čiščenje
    }, []);


    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    const filteredObroki = obroki.filter((o) => {
        const isMine = !showMineOnly || o.userEmail === userEmail;
        const obrokDate = new Date(o.timestamp);
        return isMine && obrokDate >= sevenDaysAgo && obrokDate <= now;
    });

    return (
        <div className="container">
            {isLoggedIn && (
                <h2 className="welcome-text">Pozdravljen, {userName}!</h2>
            )}
            {isLoggedIn && (
                <div className="toggle-wrapper">
                    <label>
                        <input
                            type="checkbox"
                            checked={showMineOnly}
                            onChange={() => setShowMineOnly(!showMineOnly)}
                        />{' '}
                        Pokaži samo moje obroke
                    </label>
                </div>
            )}

            {zadnjiObrok && (
            <div className="latest-obrok">
                <h3>🆕 Nedavno dodan obrok:</h3>
                <p>{zadnjiObrok}</p>
            </div>)}

            <div className="map-wrapper">
                <div className="map-container">
                    <MapContainer
                        center={[46.55472, 15.64667]}
                        zoom={13}
                        scrollWheelZoom={true}
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> prispevalci'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {filteredObroki.map((obrok) => {
                            const lat = parseFloat(obrok.locY);
                            const lng = parseFloat(obrok.locX);
                            if (isNaN(lat) || isNaN(lng)) return null;

                            return (
                                <Marker
                                    key={obrok.obrokId}
                                    position={[lat, lng]}
                                    icon={goldMarkerIcon}
                                >
                                    <Popup>
                                        <div className="popup-card">
                                            <div className="popup-image-wrapper">
                                                <img
                                                    src={obrok.imgLink}
                                                    alt={obrok.name}
                                                    className="popup-image"
                                                />
                                            </div>
                                            <div className="popup-info">
                                                <h4>🍽️ {obrok.name}</h4>
                                                <p>🕒 <strong>{new Date(obrok.timestamp).toLocaleString()}</strong></p>
                                                <p>📧 {obrok.userEmail}</p>
                                                <p>🔥 {obrok.calories} kcal</p>
                                                <p>💪 {obrok.protein}g protein</p>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>
                </div>
            </div>
        </div>
    );
};

export default Home;
