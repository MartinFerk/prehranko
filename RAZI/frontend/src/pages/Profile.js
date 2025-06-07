import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles.css';

const Profile = () => {
  const navigate = useNavigate();

  const [userName, setUserName] = useState('Uporabnik');
  const userEmail = localStorage.getItem('userEmail') || 'neznano@eposta.com';

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/auth/user?email=${encodeURIComponent(userEmail)}`);
        const data = await res.json();

        if (res.ok && data.name) {
          setUserName(data.name);
        } else {
          console.warn('⚠️ Ni imena v odgovoru, uporabljam privzeto');
        }
      } catch (err) {
        console.error('❌ Napaka pri pridobivanju uporabnika:', err);
      }
    };

    if (userEmail && userEmail !== 'neznano@eposta.com') {
      fetchUser();
    }
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
