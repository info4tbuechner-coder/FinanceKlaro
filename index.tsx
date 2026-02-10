
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// PWA Service Worker Registration
// Wir verwenden einen einfachen relativen Pfad 'sw.js' ohne führenden Schrägstrich.
// Dies stellt sicher, dass der Browser das Skript relativ zum aktuellen Verzeichnis 
// des Sandboxed-Origins auflöst und nicht gegen die ai.studio Root-Domain.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js', { scope: './' })
      .then(registration => {
        console.log('SW registered with scope: ', registration.scope);
      })
      .catch(error => {
        // Wir loggen den Fehler, verhindern aber, dass die App abstürzt
        console.warn('Service Worker registration skipped or failed:', error);
      });
  });
}
