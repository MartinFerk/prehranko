import React from 'react';
import { Link } from 'react-router-dom';
import '../styles.css';

const Navbar = () => {
  return (
    <nav className="nav">
      <ul className="nav-list">
        <li>
          <Link to="/" className="nav-link">Statistika</Link>
        </li>
        <li>
          <Link to="/login" className="nav-link">Prijava</Link>
        </li>
        <li>
          <Link to="/profile" className="nav-link">Profil</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;