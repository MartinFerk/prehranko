import React from 'react';
import { createRoot } from 'react-dom/client'; // Nova metoda za React 18+
import App from './App';
import './styles.css'; // Uvozi CSS za globalne stile

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);