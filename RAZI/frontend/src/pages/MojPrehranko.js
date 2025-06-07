import React, { useEffect, useState } from 'react';
import '../styles.css';
import { getAllObroki } from '../api/obroki';
import { updateGoals } from '../api/auth';

const MojPrehranko = () => {
    const [todayCalories, setTodayCalories] = useState(0);
    const [todayProtein, setTodayProtein] = useState(0);
    const [goals, setGoals] = useState({ calories: 2000, protein: 100 });
    const [newGoals, setNewGoals] = useState({ calories: '', protein: '' });
    const [weeklyStats, setWeeklyStats] = useState([]);

    const userEmail = localStorage.getItem('userEmail');
    const userName = localStorage.getItem('userName');

    useEffect(() => {
        const fetchAndCalculate = async () => {
            try {
                const allObroki = await getAllObroki();
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const myObroki = allObroki.filter((o) => o.userEmail === userEmail);

                // Today
                const myTodayObroki = myObroki.filter((o) => {
                    const date = new Date(o.timestamp);
                    date.setHours(0, 0, 0, 0);
                    return date.getTime() === today.getTime();
                });

                const caloriesSum = myTodayObroki.reduce((sum, o) => sum + (o.calories || 0), 0);
                const proteinSum = myTodayObroki.reduce((sum, o) => sum + (o.protein || 0), 0);

                setTodayCalories(caloriesSum);
                setTodayProtein(proteinSum);

                // Goals
                const caloricGoal = parseInt(localStorage.getItem('caloricGoal'));
                const proteinGoal = parseInt(localStorage.getItem('proteinGoal'));
                setGoals({
                    calories: isNaN(caloricGoal) ? 2000 : caloricGoal,
                    protein: isNaN(proteinGoal) ? 100 : proteinGoal,
                });
                setNewGoals({
                    calories: isNaN(caloricGoal) ? '' : caloricGoal,
                    protein: isNaN(proteinGoal) ? '' : proteinGoal,
                });

                // Weekly view (last 7 days)
                const todayDate = new Date();
                const past7 = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date(todayDate);
                    d.setDate(d.getDate() - i);
                    d.setHours(0, 0, 0, 0);
                    return d;
                });

                const weeklyData = past7.map((dateObj) => {
                    const count = myObroki.filter((o) => {
                        const d = new Date(o.timestamp);
                        d.setHours(0, 0, 0, 0);
                        return d.getTime() === dateObj.getTime();
                    }).length;

                    return {
                        date: dateObj.toLocaleDateString(),
                        count,
                    };
                }).reverse();

                setWeeklyStats(weeklyData);
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

    const handleGoalSubmit = async () => {
        try {
            const calories = parseInt(newGoals.calories);
            const protein = parseInt(newGoals.protein);
            if (!isNaN(calories)) localStorage.setItem('caloricGoal', calories);
            if (!isNaN(protein)) localStorage.setItem('proteinGoal', protein);

            await updateGoals(userEmail, calories, protein);
            setGoals({ calories, protein });
        } catch (e) {
            console.error("Napaka pri posodabljanju ciljev:", e);
        }
    };

    return (
        <div className="container">
            <h1 className="title">Moj Prehranko</h1>

            <div className="progress-section">
                <h3>Dnevni cilji</h3>

                <div className="progress-wrapper">
                    <label>Kalorije: {todayCalories} / {goals.calories} kcal</label>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{width: `${percent(todayCalories, goals.calories)}%`}}
                        />
                    </div>
                </div>

                <div className="progress-wrapper">
                    <label>Beljakovine: {todayProtein}g / {goals.protein}g</label>
                    <div className="progress-bar">
                        <div
                            className="progress-fill protein"
                            style={{width: `${percent(todayProtein, goals.protein)}%`}}
                        />
                    </div>
                </div>

                <div className="goal-section">
                    <h4>Moj cilj:</h4>
                    <div className="goal-input-group">
                        <div>
                            <label>Kalorije (kcal):</label>
                            <input
                                type="number"
                                value={newGoals.calories}
                                onChange={(e) => setNewGoals({...newGoals, calories: e.target.value})}
                            />
                        </div>
                        <div>
                            <label>Beljakovine (g):</label>
                            <input
                                type="number"
                                value={newGoals.protein}
                                onChange={(e) => setNewGoals({...newGoals, protein: e.target.value})}
                            />
                        </div>
                        <button className="goal-button" onClick={handleGoalSubmit}>Shrani cilje</button>
                    </div>
                </div>
            </div>

            <div className="weekly-section">
                <h3>Tedenski pregled</h3>
                <ul>
                    {weeklyStats.map((entry) => (
                        <li key={entry.date}>
                            {entry.date}: {entry.count} obrokov
                        </li>
                    ))}
                </ul>
            </div>
        </div>

    );
};

export default MojPrehranko;