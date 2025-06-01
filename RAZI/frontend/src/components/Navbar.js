import React from 'react';
import { Link } from 'react-router-dom';
import '../styles.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <ul className="navbar-list">
        <li className="navbar-item">
          <Link to="/" className="navbar-link">Domov</Link>
        </li>
        <li className="navbar-item">
          <Link to="/profile" className="navbar-link">Profil</Link>
        </li>
        <li className="navbar-item">
          <Link to="/login" className="navbar-link">Prijava</Link>
        </li>
        <li className="navbar-item">
          <Link to="/register" className="navbar-link">Registracija</Link>
        </li>
      </ul>
    </nav>
  );
};
export default Navbar;