import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import { LanguageProvider } from './context/LanguageContext.jsx';
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
      <LanguageProvider>
        <AuthProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
);
