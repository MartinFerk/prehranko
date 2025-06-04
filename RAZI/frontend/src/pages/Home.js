import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import '../styles.css';
import { getAllObroki } from '../api/obroki';

const Home = () => {
    const [obroki, setObroki] = useState([]);

    useEffect(() => {
        getAllObroki()
            .then(setObroki)
            .catch((err) => console.error('Napaka pri pridobivanju obrokov:', err));
    }, []);

    return (
        <div className="container">
            <h1 className="title">Statistika</h1>
            <p>Tukaj bo prikaz statistike, ko bo implementirana.</p>

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

                        {obroki.map((obrok) => (
                            <Marker
                                key={obrok.obrokId}
                                position={[obrok.locY, obrok.locX]}
                            >
                                <Popup>
                                    <div className="popup-card">
                                        <img
                                            src={obrok.imgLink}
                                            alt={obrok.name}
                                            className="popup-image"
                                        />
                                        <div className="popup-info">
                                            <h4>{obrok.name}</h4>
                                            <p><strong>Čas:</strong> {new Date(obrok.timestamp).toLocaleString()}</p>
                                            <p><strong>Uporabnik:</strong> {obrok.userEmail}</p>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            </div>
        </div>
    );
};

export default Home;
