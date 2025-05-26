import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-blue-600 p-4">
      <ul className="flex space-x-4 text-white">
        <li>
          <Link to="/" className="hover:underline">Statistika</Link>
        </li>
        <li>
          <Link to="/login" className="hover:underline">Prijava</Link>
        </li>
        <li>
          <Link to="/profile" className="hover:underline">Profil</Link>
        </li>
        <li>
          <Link to="/camera" className="hover:underline">CameraScreen</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;