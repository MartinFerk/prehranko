import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles.css';

const Profile = () => {
  const navigate = useNavigate();

  const userName = localStorage.getItem('userName') || 'Uporabnik';
  const userEmail = localStorage.getItem('userEmail') || 'neznano@eposta.com';

  const handleLogout = () => {
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    navigate('/login');
    window.location.reload();
  };

  return (
    <div className="profile-container">
      <h1 className="title">Profil</h1>
      <div className="profile-box">
        <p className="profile-text"><strong>Ime:</strong> {userName}</p>
        <p className="profile-text"><strong>E-pošta:</strong> {userEmail}</p>
        <button onClick={handleLogout} className="logout-button">
          Odjavi se
        </button>
      </div>
    </div>
  );
};

export default Profile;