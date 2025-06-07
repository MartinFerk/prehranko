import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles.css';

const Navbar = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('loggedIn') === 'true');
    const [user, setUser] = useState({ name: 'User', email: '' });
    const location = useLocation();

    useEffect(() => {
        setIsLoggedIn(localStorage.getItem('loggedIn') === 'true');

        const email = localStorage.getItem('userEmail');
        if (!email) return;

        const fetchUser = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/auth/user?email=${encodeURIComponent(email)}`)
                const data = await res.json();

                if (res.ok && data.user?.username) {
                    setUser({ name: data.user.username, email });
                } else {
                    setUser({ name: 'User', email });
                }
            } catch (err) {
                console.error('❌ Napaka pri pridobivanju uporabnika (Navbar):', err);
                setUser({ name: 'User', email });
            }
        };

        fetchUser();
    }, [location]);

    return (
        <nav className="navbar">
            <ul className="navbar-list">
                <li className="navbar-item">
                    <Link to="/" className="navbar-link">Domov</Link>
                </li>
                <li className="navbar-item">
                    <Link to="/lestvica" className="navbar-link">Lestvica</Link>
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
                        <Link to="/profile" className="navbar-link">{user.name}</Link>
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
