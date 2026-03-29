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
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // @ts-ignore - actions is not in NotificationOptions type but supported by browsers
      registration.showNotification('Timer Running', {
        body: `${timerState.currentActivityName}: ${timeDisplay}`,
        icon: '/vercel.svg',
        badge: '/vercel.svg',
        tag: 'timer-notification',
        requireInteraction: true,
        // @ts-ignore - actions property is supported by browsers but not in TypeScript types
        actions: [
          {
            action: 'stop-timer',
            title: 'Stop Timer',
            icon: '/vercel.svg',
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
