import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // ⬅️ Dodano
import '../styles.css';
import { trigger2FA } from '../api/auth';
import { API_BASE_URL } from '../api/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // ⬅️ Hook za navigacijo

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, from: "web" }),
      });


      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Napaka pri prijavi');

      await trigger2FA(email);
      alert('✅ Prijava uspešna. Počakaj na preverjanje obraza na telefonu.');
      localStorage.setItem('loggedIn', 'true');
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userName', data.name || 'Uporabnik');
    } catch (err) {
      alert('❌ ' + err.message);
    } finally {
      setLoading(false);
    }
    
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">Prijava</h2>
        <div className="form-group">
          <label className="form-label" htmlFor="email">E-pošta</label>
          <input
            type="email"
            id="email"
            className="form-input"
            placeholder="Vnesite e-pošto"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="password">Geslo</label>
          <input
            type="password"
            id="password"
            className="form-input"
            placeholder="Vnesite geslo"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button className="login-button" onClick={handleLogin} disabled={loading}>
          {loading ? 'Prijavljam...' : 'Prijavi se'}
        </button>
      </div>
    </div>
  );
};

export default Login;
