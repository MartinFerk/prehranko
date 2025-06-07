import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Register from './pages/Register';
import './styles.css';
import React from 'react';
import MojPrehranko from "./pages/MojPrehranko";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/mojprehranko" element={<MojPrehranko />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;