import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles.css';

const Navbar = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('loggedIn') === 'true');
    const location = useLocation(); // ⬅️ za zaznavo sprememb lokacije

    useEffect(() => {
        // Ob vsaki spremembi poti (npr. po navigate('/home')) preverimo localStorage
        setIsLoggedIn(localStorage.getItem('loggedIn') === 'true');
    }, [location]);

    return (
        <nav className="navbar">
            <ul className="navbar-list">
                <li className="navbar-item">
                    <Link to="/" className="navbar-link">Domov</Link>
                </li>
                <li className="navbar-item">
                    {isLoggedIn ? (
                        <Link to="/mojprehranko" className="navbar-link">Moj Prehranko</Link>
                    ) : (
                        <span className="navbar-link disabled-link">Moj Prehranko</span>
                    )}
                </li>
                <li className="navbar-item">
                    {isLoggedIn ? (
                        <Link to="/profile" className="navbar-link">Račun</Link>
                    ) : (
                        <span className="navbar-link disabled-link">Račun</span>
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
