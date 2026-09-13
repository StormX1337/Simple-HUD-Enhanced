import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { DevGallery } from './DevGallery';
import { GameProvider } from './game/GameContext';
import './index.css';

// Service Worker nur im gebauten Spiel registrieren (Offline-Hülle, Installation).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <GameProvider>
      {window.location.search.includes('gallery') ? <DevGallery /> : <App />}
    </GameProvider>
  </React.StrictMode>,
);
