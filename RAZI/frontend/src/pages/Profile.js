import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles.css';

const Profile = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState(localStorage.getItem('userName') || 'Uporabnik');
  const userEmail = localStorage.getItem('userEmail') || 'neznano@eposta.com';

  useEffect(() => {
    const fetchName = async () => {
      try {
        const res = await fetch(`/api/auth/user?email=${encodeURIComponent(userEmail)}`);
        const data = await res.json();
        if (data.name) {
          setUserName(data.name);
          localStorage.setItem('userName', data.name);
        }
      } catch (e) {
        console.error('Napaka pri pridobivanju imena:', e);
      }
    };
    if (userEmail) fetchName();
  }, [userEmail]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
    window.location.reload();
  };

  return (
      <div className="profile-container">
        <h1 className="title">Račun</h1>
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
