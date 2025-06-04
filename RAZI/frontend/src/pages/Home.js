import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../../styles.css'; // adjust the path if needed

const Home = () => {
    return (
        <div className="container">
            <h1 className="title">Statistika</h1>
            <div className="map-container">
                <MapContainer
                    center={[46.55472, 15.64667]} // Maribor
                    zoom={13}
                    scrollWheelZoom={false}
                    style={{ height: '400px', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> prispevalci'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                </MapContainer>
            </div>
        </div>
    );
};

export default Home;
