import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import '../styles.css';
import { getAllObroki } from '../api/obroki';
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
    const navigate = useNavigate();

    const userName = localStorage.getItem('userName');
    const userEmail = localStorage.getItem('userEmail');
    const isLoggedIn = localStorage.getItem('loggedIn') === 'true';

    // 🧠 Preveri prijavo in redirectaj če ni
    useEffect(() => {
        console.log('📦 localStorage check on Home mount:', {
            userName,
            userEmail,
            isLoggedIn,
        });

        if (!isLoggedIn || !userEmail) {
            alert('⚠️ Nisi prijavljen – preusmerjam na prijavo.');
            navigate('/login');
        }
    }, [isLoggedIn, userEmail, navigate]);

    // 📡 Naloži obroke
    useEffect(() => {
        const fetchObroki = async () => {
            try {
                const data = await getAllObroki();
                console.log("📦 Obroki loaded:", data);

                const invalid = data.filter(
                    (o) => isNaN(parseFloat(o.locY)) || isNaN(parseFloat(o.locX))
                );
                if (invalid.length > 0) {
                    console.warn("⚠️ Invalid coordinate entries skipped:", invalid);
                }

                setObroki(data);
            } catch (err) {
                console.error('❌ Napaka pri pridobivanju obrokov:', err);
            }
        };

        fetchObroki();
    }, []);

    const filteredObroki = showMineOnly && userEmail
        ? obroki.filter((o) => o.userEmail === userEmail)
        : obroki;

    return (
        <div className="container">
            {isLoggedIn && (
                <h2 className="welcome-text">Pozdravljen, {userName}!</h2>
            )}

            <h1 className="title">Zemljevid</h1>

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
