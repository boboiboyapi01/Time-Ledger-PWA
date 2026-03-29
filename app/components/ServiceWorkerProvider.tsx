'use client';

import { useEffect, useState } from 'react';

export function ServiceWorkerProvider() {
  const [registered, setRegistered] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered:', registration);
          setRegistered(true);

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60000); // Check every minute
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }

    // Handle install prompt
    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstall(true);
    });

    // Handle successful installation
    window.addEventListener('appinstalled', () => {
      console.log('PWA installed successfully');
      setShowInstall(false);
      setInstallPrompt(null);
    });

    // Listen for messages from Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data.type === 'STOP_TIMER') {
          // Dispatch custom event that timer component can listen to
          window.dispatchEvent(
            new CustomEvent('stopTimer', { detail: event.data })
          );
        }
      });
    }
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      console.log(`User response: ${outcome}`);
      setInstallPrompt(null);
      setShowInstall(false);
    }
  };

  if (!showInstall) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-slate-800 border border-slate-700 rounded-lg p-4 shadow-lg z-50">
      <p className="text-white mb-3 text-sm">Install Time Ledger PWA</p>
      <div className="flex gap-2">
        <button
          onClick={handleInstall}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
        >
          Install
        </button>
        <button
          onClick={() => setShowInstall(false)}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm font-medium"
        >
          Later
        </button>
      </div>
    </div>
  );
}
