import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles.css';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: 'Uporabnik', email: '' });

  useEffect(() => {
    const email = localStorage.getItem('userEmail');

    if (!email) {
      console.warn('⚠️ Ni emaila v localStorage — preusmerjam na prijavo.');
      navigate('/login');
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/auth/user?email=${encodeURIComponent(email)}`);
        const contentType = res.headers.get("content-type");

        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Neveljaven JSON odgovor strežnika.");
        }

        const data = await res.json();

        if (res.ok && data.username) {
          setUser({ name: data.username, email });
        } else {
          console.warn('⚠️ Ni imena v odgovoru, uporabljam privzeto.');
          setUser({ name: 'Uporabnik', email });
        }
      } catch (err) {
        console.error('❌ Napaka pri pridobivanju uporabnika:', err);
        setUser({ name: 'Uporabnik', email });
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('userEmail'); // 🔑 Only remove email
    navigate('/login');
    window.location.reload();
  };

  return (
      <div className="profile-container">
        <h1 className="title">Račun</h1>
        <div className="profile-box">
          <p className="profile-text"><strong>Ime:</strong> {user.name}</p>
          <p className="profile-text"><strong>E-pošta:</strong> {user.email}</p>
          <button onClick={handleLogout} className="logout-button">
            Odjavi se
          </button>
        </div>
      </div>
  );
};

export default Profile;
