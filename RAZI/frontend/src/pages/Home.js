import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles.css'; // adjust the path if needed

const Home = () => {
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
                        style={{height: '100%', width: '100%'}}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> prispevalci'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                    </MapContainer>
                </div>
            </div>
        </div>

    );
};

export default Home;
