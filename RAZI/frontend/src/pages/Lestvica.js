import React, { useEffect, useState } from 'react';
import '../styles.css';
// 1. Zamenjamo uvoz: namesto getAllObroki uvozimo getFullObroki
import { getFullObroki } from '../api/obroki';

const rankIcons = ['🥇', '🥈', '🥉'];

const Lestvica = () => {
    const [allObroki, setAllObroki] = useState([]);
    const [timeFilter, setTimeFilter] = useState('danes');
    const [loading, setLoading] = useState(true);

    // Na lestvici emaila ne rabimo več kot parameter za fetch,
    // ker fetchamo vse (Full)
    useEffect(() => {
        const fetchObroki = async () => {
            try {
                setLoading(true);
                // 2. Pokličemo novo funkcijo, ki vrne VSE obroke iz baze
                const data = await getFullObroki();

                if (Array.isArray(data)) {
                    setAllObroki(data);
                }
            } catch (err) {
                console.error('❌ Napaka pri nalaganju obrokov za lestvico:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchObroki();
    }, []); // Prazen array, ker fetchamo globalne podatke

    const filterByTime = (obroki) => {
        if (!Array.isArray(obroki)) return [];

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        return obroki.filter((o) => {
            const date = new Date(o.timestamp);
            const mealDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

            if (timeFilter === 'danes') {
                return mealDate.getTime() === startOfToday.getTime();
            } else if (timeFilter === 'teden') {
                const weekAgo = new Date(startOfToday);
                weekAgo.setDate(startOfToday.getDate() - 6);
                // Vključimo vse od pred 6 dnevi do danes
                return mealDate >= weekAgo && mealDate <= startOfToday;
            } else {
                return true; // Lifetime
            }
        });
    };

    const filtered = filterByTime(allObroki);

    // TOP 3 po kalorijah
    const topByCalories = [...filtered]
        .sort((a, b) => (b.calories || 0) - (a.calories || 0))
        .slice(0, 3);

    // TOP 3 po beljakovinah
    const topByProtein = [...filtered]
        .sort((a, b) => (b.protein || 0) - (a.protein || 0))
        .slice(0, 3);

    // TOP 3 Uporabniki (Skupne kalorije)
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
            <h1 className="title">🏆 Globalna Lestvica</h1>

            <div className="radio-buttons">
                {['danes', 'teden', 'lifetime'].map(option => (
                    <label key={option} style={{ marginRight: '15px', cursor: 'pointer', fontWeight: timeFilter === option ? 'bold' : 'normal' }}>
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

            {loading ? (
                <p>Nalagam podatke iz baze...</p>
            ) : filtered.length === 0 ? (
                <p style={{ marginTop: '20px' }}>Ni podatkov za izbrano obdobje.</p>
            ) : (
                <div className="leaderboard-section">
                    <h2>🍽️ Najbolj kalorični obroki</h2>
                    <ol>
                        {topByCalories.map((o, idx) => (
                            <li key={`${o.obrokId}-${idx}`} style={{ marginBottom: '10px' }}>
                                {rankIcons[idx]} <strong>{o.name}</strong> <span style={{fontSize: '0.8em', color: '#666'}}>({o.userEmail})</span> – {o.calories} kcal
                            </li>
                        ))}
                    </ol>

                    <h2>💪 Največ beljakovin v obroku</h2>
                    <ol>
                        {topByProtein.map((o, idx) => (
                            <li key={`${o.obrokId}-${idx}`} style={{ marginBottom: '10px' }}>
                                {rankIcons[idx]} <strong>{o.name}</strong> <span style={{fontSize: '0.8em', color: '#666'}}>({o.userEmail})</span> – {o.protein}g
                            </li>
                        ))}
                    </ol>

                    <h2>👤 Top uporabniki (Skupaj kcal)</h2>
                    <ol>
                        {topUsers.map(([email, calSum], idx) => (
                            <li key={email} style={{ marginBottom: '10px' }}>
                                {rankIcons[idx]} <strong>{email}</strong> – {Math.round(calSum)} kcal
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </div>
    );
};

export default Lestvica;