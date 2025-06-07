import React, { useEffect, useState } from 'react';
import '../styles.css';
import { getAllObroki } from '../api/obroki';

const Lestvica = () => {
    const [allObroki, setAllObroki] = useState([]);
    const [timeFilter, setTimeFilter] = useState('danes');

    useEffect(() => {
        const fetchObroki = async () => {
            try {
                const data = await getAllObroki();
                setAllObroki(data);
            } catch (err) {
                console.error('❌ Napaka pri nalaganju obrokov:', err);
            }
        };
        fetchObroki();
    }, []);

    const filterByTime = (obroki) => {
        const now = new Date();
        return obroki.filter((o) => {
            const date = new Date(o.timestamp);
            date.setHours(0, 0, 0, 0);
            now.setHours(0, 0, 0, 0);

            if (timeFilter === 'danes') {
                return date.getTime() === now.getTime();
            } else if (timeFilter === 'teden') {
                const weekAgo = new Date(now);
                weekAgo.setDate(now.getDate() - 6);
                return date >= weekAgo && date <= now;
            } else {
                return true;
            }
        });
    };

    const filtered = filterByTime(allObroki);

    const topByCalories = [...filtered].sort((a, b) => b.calories - a.calories).slice(0, 5);
    const topByProtein = [...filtered].sort((a, b) => b.protein - a.protein).slice(0, 5);
    const topUsers = Object.entries(
        filtered.reduce((acc, o) => {
            acc[o.userEmail] = (acc[o.userEmail] || 0) + 1;
            return acc;
        }, {})
    )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    return (
        <div className="container">
            <h1 className="title">Lestvica</h1>

            <div className="radio-buttons">
                {['danes', 'teden', 'lifetime'].map(option => (
                    <label key={option}>
                        <input
                            type="radio"
                            value={option}
                            checked={timeFilter === option}
                            onChange={() => setTimeFilter(option)}
                        />
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                    </label>
                ))}
            </div>

            
            <div className="leaderboard-section">
                <h2>🍽️ Top 5 obrokov po kalorijah</h2>
                <ul>
                    {topByCalories.map((o, idx) => (
                        <li key={o.obrokId}>{idx + 1}. {o.name} – {o.calories} kcal</li>
                    ))}
                </ul>

                <h2>💪 Top 5 obrokov po beljakovinah</h2>
                <ul>
                    {topByProtein.map((o, idx) => (
                        <li key={o.obrokId}>{idx + 1}. {o.name} – {o.protein}g</li>
                    ))}
                </ul>

                <h2>👤 Top 5 uporabnikov po številu obrokov</h2>
                <ul>
                    {topUsers.map(([email, count], idx) => (
                        <li key={email}>{idx + 1}. {email} – {count} obrokov</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Lestvica;
