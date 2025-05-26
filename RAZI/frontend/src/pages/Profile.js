import React from 'react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Simulacija odjave (preusmeritev na prijavo)
    navigate('/login');
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Profil</h1>
      <div className="bg-white p-4 rounded shadow-md">
        <p className="mb-2"><strong>Ime:</strong> Uporabnik</p>
        <p className="mb-4"><strong>E-pošta:</strong> uporabnik@primer.com</p>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white p-2 rounded hover:bg-red-700"
        >
          Odjavi se
        </button>
      </div>
    </div>
  );
};

export default Profile;