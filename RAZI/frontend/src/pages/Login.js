import React from 'react';
import '../styles.css';

const Login = () => {
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
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="password">Geslo</label>
          <input
            type="password"
            id="password"
            className="form-input"
            placeholder="Vnesite geslo"
          />
        </div>
        <button className="login-button">
          Prijavi se
        </button>
      </div>
    </div>
  );
};

export default Login;