// src/pages/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles.css';
import { trigger2FA, finishLogin } from '../api/auth';
import { API_BASE_URL } from '../api/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    try {
      // 1. Poskusi prijavo
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, from: 'web' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Napaka pri prijavi');

      // 2. Sproži 2FA
      await trigger2FA(email);
      alert('✅ Prijava uspešna. Počakaj na preverjanje obraza na telefonu.');

      // 3. Začni polling za preverjanje 2FA
      const checkInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`${API_BASE_URL}/auth/check-2fa?email=${email}`);
          const statusData = await statusRes.json();
          console.log('📡 /check-2fa odgovor:', statusData);

          if (statusData.is2faVerified) {
            clearInterval(checkInterval);

            // 4. Dokončaj prijavo in dobi vse podatke
            const finishData = await finishLogin(email);

            // 5. Shrani podatke v localStorage
            localStorage.setItem('loggedIn', 'true');
            localStorage.setItem('userEmail', finishData.user.email);
            localStorage.setItem('userName', finishData.user.name || 'Uporabnik');

            if (finishData.user.caloricGoal != null) {
              localStorage.setItem('caloricGoal', finishData.user.caloricGoal);
            }

            if (finishData.user.proteinGoal != null) {
              localStorage.setItem('proteinGoal', finishData.user.proteinGoal);
            }

            // 6. Preusmeri na začetno stran
            navigate('/home');
          }
        } catch (error) {
          console.error('❌ Napaka med preverjanjem 2FA:', error);
          clearInterval(checkInterval);
        }
      }, 3000);
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
