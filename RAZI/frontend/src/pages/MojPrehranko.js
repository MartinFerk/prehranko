import React, { useEffect, useState } from 'react';
import '../styles.css';
import { getUserByEmail } from '../api/auth';
import { getAllObroki } from '../api/obroki';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    CartesianGrid,
    Area
} from 'recharts';

const MojPrehranko = () => {
    const [todayCalories, setTodayCalories] = useState(0);
    const [todayProtein, setTodayProtein] = useState(0);
    const [goals, setGoals] = useState({ calories: 2000, protein: 100 });
    const [weeklyStats, setWeeklyStats] = useState([]);
    const navigate = useNavigate();

    const userEmail = localStorage.getItem('userEmail');
     const isLoggedIn = localStorage.getItem('loggedIn') === 'true';

    useEffect(() => {
    if (!isLoggedIn || !userEmail) {
      alert('⚠️ Nisi prijavljen – preusmerjam na prijavo.');
      navigate('/login');
      return;
     }
    });

    useEffect(() => {
        
        const fetchAndCalculate = async () => {
            try {
                const allObroki = await getAllObroki();
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const myObroki = allObroki.filter((o) => o.userEmail === userEmail);

                const myTodayObroki = myObroki.filter((o) => {
                    const date = new Date(o.timestamp);
                    date.setHours(0, 0, 0, 0);
                    return date.getTime() === today.getTime();
                });

                const caloriesSum = myTodayObroki.reduce((sum, o) => sum + (o.calories || 0), 0);
                const proteinSum = myTodayObroki.reduce((sum, o) => sum + (o.protein || 0), 0);

                setTodayCalories(caloriesSum);
                setTodayProtein(proteinSum);

                const userData = await getUserByEmail(userEmail);
                const caloricGoal = parseInt(userData.user.caloricGoal);
                const proteinGoal = parseInt(userData.user.proteinGoal);

                setGoals({
                    calories: isNaN(caloricGoal) ? 2000 : caloricGoal,
                    protein: isNaN(proteinGoal) ? 100 : proteinGoal,
                });

                const todayDate = new Date();
                const past7 = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date(todayDate);
                    d.setDate(d.getDate() - i);
                    d.setHours(0, 0, 0, 0);
                    return d;
                });

                const weeklyData = past7.map((dateObj) => {
                    const entries = myObroki.filter((o) => {
                        const d = new Date(o.timestamp);
                        d.setHours(0, 0, 0, 0);
                        return d.getTime() === dateObj.getTime();
                    });

                    const calories = entries.reduce((sum, o) => sum + (o.calories || 0), 0);
                    const protein = entries.reduce((sum, o) => sum + (o.protein || 0), 0);

                    return {
                        date: dateObj.toLocaleDateString('sl-SI', { weekday: 'short' }),
                        calories,
                        protein
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

    const getColorClass = (p) => {
        if (p < 25) return 'red';
        if (p < 50) return 'orange';
        if (p < 75) return 'yellow';
        return 'green';
    };

    return (
        <div className="container">
            <div className="progress-section">
                <h2>Dnevni pregled</h2>
                <div className="progress-row">
                    <div className="label-column">
                        Kalorije: {todayCalories} / {goals.calories} kcal
                    </div>
                    <div className="bar-column">
                        <div className="progress-bar">
                            <div
                                className={`progress-fill ${getColorClass(percent(todayCalories, goals.calories))}`}
                                style={{ width: `${percent(todayCalories, goals.calories)}%` }}
                            >
                                <span className="progress-percent">{percent(todayCalories, goals.calories)}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="progress-row">
                    <div className="label-column">
                        Beljakovine: {todayProtein}g / {goals.protein}g
                    </div>
                    <div className="bar-column">
                        <div className="progress-bar">
                            <div
                                className={`progress-fill ${getColorClass(percent(todayProtein, goals.protein))}`}
                                style={{ width: `${percent(todayProtein, goals.protein)}%` }}
                            >
                                <span className="progress-percent">{percent(todayProtein, goals.protein)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <h2>Tedenski pregled (kalorije)</h2>
            <div style={{ width: '900px', margin: '0 auto' }}>
                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={weeklyStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#8884d8" stopOpacity={0.4}/>
                                <stop offset="100%" stopColor="#8884d8" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, goals.calories * 1.1]}  tickFormatter={(value) => Math.round(value)} />
                        <Tooltip formatter={(value) => `${value} kcal`} />
                        <ReferenceLine y={goals.calories} stroke="gray" strokeDasharray="3 3" />
                        <Area
                            type="monotone"
                            dataKey="calories"
                            stroke="none"
                            fill="url(#colorCalories)"
                        />
                        <Line
                            type="monotone"
                            dataKey="calories"
                            stroke="#8884d8"
                            strokeWidth={3}
                            dot={{
                                stroke: '#000',
                                strokeWidth: 1,
                                fill: (entry) => entry.calories >= goals.calories ? 'green' : 'red',
                            }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <h2 style={{ marginTop: '40px' }}>Tedenski pregled (beljakovine)</h2>
            <div style={{ width: '900px', margin: '0 auto' }}>
                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={weeklyStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorProtein" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#82ca9d" stopOpacity={0.4} />
                                <stop offset="100%" stopColor="#82ca9d" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, goals.protein * 1.1]} tickFormatter={(value) => Math.round(value)} />
                        <Tooltip formatter={(value) => `${value} g`} />
                        <ReferenceLine y={goals.protein} stroke="gray" strokeDasharray="3 3" />
                        <Area
                            type="monotone"
                            dataKey="protein"
                            stroke="none"
                            fill="url(#colorProtein)"
                        />
                        <Line
                            type="monotone"
                            dataKey="protein"
                            stroke="#82ca9d"
                            strokeWidth={3}
                            dot={{
                                stroke: '#000',
                                strokeWidth: 1,
                                fill: (entry) => entry.protein >= goals.protein ? 'green' : 'red',
                            }}
                        />
                    </LineChart>
                </ResponsiveContainer>


            </div>
        </div>
    );
};

export default MojPrehranko;
