import React, { useEffect, useState } from 'react';
import '../styles.css';
import { getAllObroki } from '../api/obroki';

const MojPrehranko = () => {
    const [todayCalories, setTodayCalories] = useState(0);
    const [todayProtein, setTodayProtein] = useState(0);
    const [goals, setGoals] = useState({ calories: null, protein: null });

    const userEmail = localStorage.getItem('userEmail');
    const userName = localStorage.getItem('userName');

    useEffect(() => {
        const fetchAndCalculate = async () => {
            try {
                const allObroki = await getAllObroki();

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const myTodayObroki = allObroki.filter((o) => {
                    const isMine = o.userEmail === userEmail;
                    const date = new Date(o.timestamp);
                    date.setHours(0, 0, 0, 0);
                    return isMine && date.getTime() === today.getTime();
                });

                const caloriesSum = myTodayObroki.reduce((sum, o) => sum + (o.calories || 0), 0);
                const proteinSum = myTodayObroki.reduce((sum, o) => sum + (o.protein || 0), 0);

                setTodayCalories(caloriesSum);
                setTodayProtein(proteinSum);

                // Fetch user goals from backend or localStorage
                const caloricGoal = parseInt(localStorage.getItem('caloricGoal'));
                const proteinGoal = parseInt(localStorage.getItem('proteinGoal'));



                setGoals({
                    calories: isNaN(caloricGoal) ? 2000 : caloricGoal,
                    protein: isNaN(proteinGoal) ? 100 : proteinGoal,
                });

            } catch (err) {
                console.error("Napaka pri pridobivanju obrokov:", err);
            }
        };

        fetchAndCalculate();
    }, [userEmail]);

    const percent = (val, goal) => {
        if (!goal || goal === 0) return 0;
        return Math.min(100, Math.round((val / goal) * 100));
    };

    return (
        <div className="container">
            <h1 className="title">Moj Prehranko</h1>
            <div className="profile-box">
                <p><strong>Ime:</strong> {userName}</p>
                <p><strong>E-pošta:</strong> {userEmail}</p>
            </div>

            <div className="progress-section">
                <h3>Dnevni cilji</h3>

                <div className="progress-wrapper">
                    <label>Kalorije: {todayCalories} / {goals.calories} kcal</label>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${percent(todayCalories, goals.calories)}%` }}
                        />
                    </div>
                </div>

                <div className="progress-wrapper">
                    <label>Beljakovine: {todayProtein}g / {goals.protein}g</label>
                    <div className="progress-bar">
                        <div
                            className="progress-fill protein"
                            style={{ width: `${percent(todayProtein, goals.protein)}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MojPrehranko;
