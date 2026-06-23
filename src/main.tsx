import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // السطر ده مهم جداً عشان النيومورفيزم والـ Tailwind يشتغلوا!

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);