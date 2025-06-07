// src/pages/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles.css';
import {trigger2FA, finishLogin, getUserByEmail} from '../api/auth';
import { API_BASE_URL } from '../api/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setStatus('');
    setError('');

    try {
      // 1. Prijava
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, from: 'web' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Napaka pri prijavi');

      // 2. Sproži 2FA
      await trigger2FA(email);
      setStatus('✅ Prijava uspešna. Čakam na preverjanje obraza na telefonu...');

      // 3. Polling
      const checkInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`${API_BASE_URL}/auth/check-2fa?email=${email}`);
          const statusData = await statusRes.json();

          console.log('📡 /check-2fa odgovor:', statusData);

          if (statusData.is2faVerified) {
            clearInterval(checkInterval);

            // 🔄 Pridobi uporabnika
            const userData = await getUserByEmail(email);

            // 💾 Shrani podatke
            localStorage.setItem('loggedIn', 'true');
            localStorage.setItem('userEmail', userData.user.email);

            // ✅ Navigacija po uspešni prijavi
            navigate('/home');
          }

        } catch (err) {
          console.error('❌ Napaka med preverjanjem 2FA:', err);
          clearInterval(checkInterval);
          setError('Napaka pri preverjanju 2FA');
        }
      }, 3000);
    } catch (err) {
      setError('❌ ' + err.message);
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

          {status && <p className="status-text" style={{ color: 'green', marginTop: '10px' }}>{status}</p>}
          {error && <p className="error-text" style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
        </div>
      </div>
  );
};

export default Login;
