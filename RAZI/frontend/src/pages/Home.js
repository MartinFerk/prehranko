import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import '../styles.css';
import { getAllObroki, getLastObrok } from '../api/obroki';
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
  const [zadnjiObrok, setZadnjiObrok] = useState('');

  const userEmail = localStorage.getItem('userEmail');
  const isLoggedIn = localStorage.getItem('loggedIn') === 'true';
    /*
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
*/
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
        const data = await getLastObrok();
        setZadnjiObrok(data.obrok);
      } catch (err) {
        console.error("Napaka pri nalaganju zadnjega obroka:", err);
      }
    };

    fetchZadnjiObrok();
    const interval = setInterval(fetchZadnjiObrok, 5000);
    return () => clearInterval(interval);
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
  <div className="home-layout">
    <div className="left-panel">
        {isLoggedIn && (
        <h2 className="welcome-text">Pozdravljen, {userName}!</h2>
        )}
      {zadnjiObrok && typeof zadnjiObrok === 'object' && (
        <div className="latest-obrok">
          <h3>Nedavno dodan obrok:</h3>
          <p><strong>Ime:</strong> {zadnjiObrok.name}</p>
          <p><strong>Email:</strong> {zadnjiObrok.userEmail}</p>
          <p><strong>Kcal:</strong> {zadnjiObrok.calories} kcal</p>
          <p><strong>Beljakovine:</strong> {zadnjiObrok.protein} g</p>
          <p>
            <strong>Lokacija:</strong>{' '}
            Lat {zadnjiObrok.locY?.toFixed(3)}, Long {zadnjiObrok.locX?.toFixed(3)}
          </p>
        </div>
      )}
    </div>

    <div className="right-panel">
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
                    <img
                      src={obrok.imgLink}
                      alt={obrok.name}
                      className="popup-image"
                    />
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

      <div className="checkbox-wrapper">
        <label>
            <input
            type="checkbox"
            checked={showMineOnly}
            onChange={() => setShowMineOnly(!showMineOnly)}
            />{' '}
            Pokaži samo moje obroke
        </label>
        </div>
    </div>
  </div>
);

};

export default Home;
