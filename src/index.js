import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { wakeServer } from './api/client';

// Start waking the backend straight away (see api/client.js).
wakeServer();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);