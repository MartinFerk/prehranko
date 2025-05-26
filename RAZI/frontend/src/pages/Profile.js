import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles.css';

const Profile = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="profile-container">
      <h1 className="title">Profil</h1>
      <div className="profile-box">
        <p className="profile-text"><strong>Ime:</strong> Uporabnik</p>
        <p className="profile-text"><strong>E-pošta:</strong> uporabnik@primer.com</p>
        <button
          onClick={handleLogout}
          className="logout-button"
        >
          Odjavi se
        </button>
      </div>
    </div>
  );
};

export default Profile;