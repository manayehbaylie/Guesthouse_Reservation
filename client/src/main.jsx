import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import App from './App.jsx';
import { checkBackendHealth, getBackendMode, setBackendMode } from './services/api.js';
import './index.css';

checkBackendHealth().then((ok) => {
  if (ok && getBackendMode() === 'api') {
    setBackendMode('api');
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
