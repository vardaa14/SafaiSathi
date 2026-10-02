export interface LiveNotification {
  id: string;
  type: 'VEHICLE_ARRIVED' | 'COLLECTION_COMPLETED' | 'TRIP_STARTED' | 'RETURNED_TO_PLANT' | 'CUSTOM';
  requestId?: string;
  vehicleId: string;
  driverName: string;
  driverPhone?: string;
  customerName?: string;
  customerAddress?: string;
  proofImageUrl?: string;
  title: string;
  message: string;
  timestamp: string;
  target?: 'ALL' | 'ADMIN' | 'CITIZEN' | 'DRIVER';
}

type NotificationListener = (notification: LiveNotification) => void;

const NOTIFICATION_STORAGE_KEY = 'safaisaathi_live_notifications_v1';
const BROADCAST_EVENT_NAME = 'safaisaathi_broadcast_event';

class NotificationService {
  private listeners: Set<NotificationListener> = new Set();
  private recentNotifications: LiveNotification[] = [];

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window !== 'undefined') {
      // Listen to window custom event (same-tab)
      window.addEventListener(BROADCAST_EVENT_NAME, (event: any) => {
        if (event.detail) {
          this.notifyLocalListeners(event.detail);
        }
      });

      // Listen to storage event (cross-tab sync)
      window.addEventListener('storage', (event) => {
        if (event.key === NOTIFICATION_STORAGE_KEY && event.newValue) {
          try {
            const notif: LiveNotification = JSON.parse(event.newValue);
            this.notifyLocalListeners(notif);
          } catch {
            // ignore
          }
        }
      });
    }
  }

  private notifyLocalListeners(notification: LiveNotification) {
    // Add to recent cache
    this.recentNotifications = [notification, ...this.recentNotifications.slice(0, 49)];
    this.listeners.forEach((listener) => {
      try {
        listener(notification);
      } catch (err) {
        console.error('Error in notification listener:', err);
      }
    });
  }

  public subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public emit(notification: Omit<LiveNotification, 'id' | 'timestamp'>): LiveNotification {
    const fullNotification: LiveNotification = {
      ...notification,
      id: `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString()
    };

    if (typeof window !== 'undefined') {
      // 1. Dispatch custom event locally
      window.dispatchEvent(
        new CustomEvent(BROADCAST_EVENT_NAME, { detail: fullNotification })
      );

      // 2. Write to localStorage to trigger storage event on other tabs
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(fullNotification));
    }

    return fullNotification;
  }

  public getRecentNotifications(): LiveNotification[] {
    return [...this.recentNotifications];
  }
}

export const notificationService = new NotificationService();
