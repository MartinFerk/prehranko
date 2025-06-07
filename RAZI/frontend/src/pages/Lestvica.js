import React, { useEffect, useState } from 'react';
import '../styles.css';
import { getAllObroki } from '../api/obroki';

const rankIcons = ['🥇', '🥈', '🥉'];

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

    const topByCalories = [...filtered]
        .sort((a, b) => b.calories - a.calories)
        .slice(0, 3);

    const topByProtein = [...filtered]
        .sort((a, b) => b.protein - a.protein)
        .slice(0, 3);

    const topUsers = Object.entries(
        filtered.reduce((acc, o) => {
            acc[o.userEmail] = (acc[o.userEmail] || 0) + (o.calories || 0);
            return acc;
        }, {})
    )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

    return (
        <div className="container">
            <h1 className="title">🏆 Lestvica</h1>

            <div className="radio-buttons">
                {['danes', 'teden', 'lifetime'].map(option => (
                    <label key={option} style={{ marginRight: '15px' }}>
                        <input
                            type="radio"
                            value={option}
                            checked={timeFilter === option}
                            onChange={() => setTimeFilter(option)}
                        />
                        {' '}{option.charAt(0).toUpperCase() + option.slice(1)}
                    </label>
                ))}
            </div>

            
            <div className="leaderboard-section">
                <h2>🍽️ Top 3 obroki po kalorijah</h2>
                <ol>
                    {topByCalories.map((o, idx) => (
                        <li key={o.obrokId} style={{ marginBottom: '10px' }}>
                            {rankIcons[idx]} <strong>{o.name}</strong> – {o.calories} kcal
                        </li>
                    ))}
                </ol>

                <h2>💪 Top 3 obroki po beljakovinah</h2>
                <ol>
                    {topByProtein.map((o, idx) => (
                        <li key={o.obrokId} style={{ marginBottom: '10px' }}>
                            {rankIcons[idx]} <strong>{o.name}</strong> – {o.protein}g
                        </li>
                    ))}
                </ol>

                <h2>👤 Top 3 uporabniki po skupnih kalorijah</h2>
                <ol>
                    {topUsers.map(([email, calSum], idx) => (
                        <li key={email} style={{ marginBottom: '10px' }}>
                            {rankIcons[idx]} <strong>{email}</strong> – {Math.round(calSum)} kcal
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    );
};

export default Lestvica;
