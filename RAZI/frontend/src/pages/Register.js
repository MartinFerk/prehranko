import React, { useState } from 'react';
import { registerUser } from '../api/auth';     // ⬅️ popravljena pot
import '../styles.css'; 

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    setStatus(null);

    try {
      const result = await registerUser(email, password);
      setStatus({ success: true, message: result.message || 'Registracija uspešna!' });
      setEmail('');
      setPassword('');
    } catch (err) {
      setStatus({ success: false, message: err.message || 'Napaka pri registraciji' });
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">Registracija</h2>
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">E-pošta</label>
            <input
              type="email"
              id="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Vnesite e-pošto"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Geslo</label>
            <input
              type="password"
              id="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Vnesite geslo"
            />
          </div>

          <button type="submit" className="login-button">
            Registriraj se
          </button>
        </form>

        {status && (
          <div
            style={{
              marginTop: '1rem',
              color: status.success ? 'green' : 'red',
              fontWeight: 'bold'
            }}
          >
            {status.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
