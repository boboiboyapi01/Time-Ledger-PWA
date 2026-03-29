import { TimerState } from './types';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export async function showTimerNotification(
  timerState: TimerState,
  timeDisplay: string
): Promise<void> {
  if ('serviceWorker' in navigator && 'Notification' in window) {
    if (Notification.permission !== 'granted') return;
    
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Use silent: true and re-use tag to prevent multiple buzzes/sounds
      // @ts-ignore
      registration.showNotification('Time Ledger Timer', {
        body: `${timerState.currentActivityName}: ${timeDisplay}`,
        icon: '/sand-clock.png',
        badge: '/sand-clock.png',
        tag: 'timer-notification',
        requireInteraction: true,
        silent: true, // IMPORTANT: Prevents constant buzzing
        // @ts-ignore
        actions: [
          {
            action: 'stop-timer',
            title: 'Stop Timer',
          },
        ],
        data: {
          activityName: timerState.currentActivityName,
          activityType: timerState.currentActivityType,
        },
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }
}

export async function closeTimerNotification(): Promise<void> {
  if ('serviceWorker' in navigator && 'Notification' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const notifications = await registration.getNotifications({ tag: 'timer-notification' });
      notifications.forEach(notification => notification.close());
    } catch (error) {
      console.error('Error closing notification:', error);
    }
  }
}

export function handleNotificationClick(event: any): void {
  if (event.action === 'stop-timer') {
    // This will be handled by the service worker
    event.notification.close();
    
    // Post message to all clients to stop the timer
    if (self instanceof ServiceWorkerGlobalScope) {
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'STOP_TIMER',
          });
        });
      });
    }
  }
}
