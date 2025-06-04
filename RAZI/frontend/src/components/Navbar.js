import React from 'react';
import { Link } from 'react-router-dom';
import '../styles.css';

const Navbar = () => {
  const isLoggedIn = localStorage.getItem('loggedIn') === 'true';

  return (
      <nav className="navbar">
        <ul className="navbar-list">
          <li className="navbar-item">
            <Link to="/" className="navbar-link">Domov</Link>
          </li>
          <li className="navbar-item">
            {isLoggedIn ? (
                <Link to="/profile" className="navbar-link">Profil</Link>
            ) : (
                <span className="navbar-link disabled-link">Profil</span>
            )}
          </li>
          <li className="navbar-item">
            <Link to="/login" className="navbar-link">Prijava</Link>
          </li>
        </ul>
      </nav>
  );
};

export default Navbar;
