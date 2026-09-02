import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { ApiService } from '../services/api.js';
import { useAuth } from './AuthContext.jsx';

const NotificationContext = createContext(null);
const NOTIFICATION_STORAGE_KEY = 'gh_notifications';

function getStoredNotifications(user) {
  if (!user) return [];

  try {
    const raw = localStorage.getItem(`${NOTIFICATION_STORAGE_KEY}:${user.id || user.email || 'guest'}`);

    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredNotifications(user, list) {
  if (!user) return;

  try {
    localStorage.setItem(
      `${NOTIFICATION_STORAGE_KEY}:${user.id || user.email || 'guest'}`,
      JSON.stringify(Array.isArray(list) ? list : [])
    );
  } catch {
    // Ignore storage quota issues.
  }
}

function buildDemoNotifications(user) {
  if (!user) return [];

  const userName = user.name || user.fullName || 'Guest';
  const role = String(user.role || 'GUEST').toUpperCase();

  const demoList = [
    {
      id: 'demo-welcome',
      title: 'Welcome back',
      message: `Hello ${userName}! Your guesthouse account is ready and the notification center is active.`,
      isRead: false,
      category: 'system',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-reminder',
      title: 'Booking reminder',
      message: 'A recent reservation update is waiting for your review in the dashboard.',
      isRead: false,
      category: role === 'OWNER' ? 'guesthouse' : 'reservation',
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
  ];

  if (role === 'OWNER') {
    demoList.push({
      id: 'demo-owner',
      title: 'New reservation received',
      message: 'A guest has booked a room in your guesthouse and payment is awaiting confirmation.',
      isRead: false,
      category: 'reservation',
      createdAt: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
    });

    demoList.push({
      id: 'demo-owner-payment',
      title: 'Payment received',
      message: 'A guest payment was successfully received and the reservation has been confirmed.',
      isRead: true,
      category: 'payment',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    });
  }

  if (role === 'GUEST') {
    demoList.push({
      id: 'demo-guest',
      title: 'Reservation created',
      message: 'Your reservation request has been created successfully and is waiting for payment confirmation.',
      isRead: false,
      category: 'reservation',
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    });

    demoList.push({
      id: 'demo-payment',
      title: 'Payment successful',
      message: 'Your payment was processed successfully and your reservation is now confirmed.',
      isRead: false,
      category: 'payment',
      createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    });
  }

  return demoList;
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toasts, setToasts] = useState([]);

  // Store known notification IDs to detect newly arrived ones during polling
  const knownIdsRef = useRef(new Set());
  const isFirstLoadRef = useRef(true);

  // ----------------------------------------------------------------
  // TOAST ALERT MANAGEMENT
  // ----------------------------------------------------------------

  const dismissToast = useCallback((toastId) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  const showToast = useCallback((notification) => {
    if (!notification) return;
    const toastId = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newToast = {
      id: toastId,
      notificationId: notification.id,
      title: notification.title || 'Notification',
      message: notification.message || '',
      category: notification.category || 'system',
      createdAt: notification.createdAt || new Date().toISOString(),
    };

    setToasts((prev) => [newToast, ...prev].slice(0, 4)); // Keep maximum 4 toasts on screen

    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      dismissToast(toastId);
    }, 6000);
  }, [dismissToast]);

  // ----------------------------------------------------------------
  // FETCH NOTIFICATIONS
  // ----------------------------------------------------------------

  const fetchNotifications = useCallback(async (isPolling = false) => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setError('');
      knownIdsRef.current.clear();
      isFirstLoadRef.current = true;
      return;
    }

    if (!isPolling) {
      setLoading(true);
    }

    try {
      setError('');
      const hasAuthToken = Boolean(localStorage.getItem('token'));
      const stored = getStoredNotifications(user);

      if (!hasAuthToken) {
        const fallback = stored.length > 0 ? stored : buildDemoNotifications(user);
        const count = fallback.filter((n) => !n.isRead).length;
        knownIdsRef.current = new Set(fallback.map((n) => n.id));
        isFirstLoadRef.current = false;
        setNotifications(fallback);
        setUnreadCount(count);
        saveStoredNotifications(user, fallback);
        return;
      }

      const data = await ApiService.getNotifications();
      let list = Array.isArray(data) ? data : [];

      if (list.length === 0) {
        list = stored.length > 0 ? stored : buildDemoNotifications(user);
      }

      const count = list.filter((n) => !n.isRead).length;

      if (!isFirstLoadRef.current && isPolling) {
        const newUnread = list.filter(
          (n) => !n.isRead && !knownIdsRef.current.has(n.id)
        );

        if (newUnread.length > 0) {
          newUnread.slice(0, 2).forEach((n) => {
            showToast(n);
          });
        }
      }

      const currentIds = new Set(list.map((n) => n.id));
      knownIdsRef.current = currentIds;
      isFirstLoadRef.current = false;

      setNotifications(list);
      setUnreadCount(count);
      saveStoredNotifications(user, list);
    } catch (error) {
      const fallback = getStoredNotifications(user).length > 0
        ? getStoredNotifications(user)
        : buildDemoNotifications(user);
      const count = fallback.filter((n) => !n.isRead).length;

      knownIdsRef.current = new Set(fallback.map((n) => n.id));
      isFirstLoadRef.current = false;

      setNotifications(fallback);
      setUnreadCount(count);
      saveStoredNotifications(user, fallback);
      setError(error?.message || 'Could not load notifications from the server.');
      console.warn('Error fetching notifications:', error?.message || error);
    } finally {
      if (!isPolling) {
        setLoading(false);
      }
    }
  }, [user, showToast]);

  // ----------------------------------------------------------------
  // INITIAL LOAD & BACKGROUND POLLING (Every 10 seconds)
  // ----------------------------------------------------------------

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setError('');
      knownIdsRef.current.clear();
      isFirstLoadRef.current = true;
      return;
    }

    // Initial load
    fetchNotifications(false);

    const handleAuthStateRefresh = () => {
      fetchNotifications(false);
    };

    window.addEventListener('auth-login', handleAuthStateRefresh);
    window.addEventListener('auth-register', handleAuthStateRefresh);
    window.addEventListener('auth-switch', handleAuthStateRefresh);
    window.addEventListener('auth-logout', handleAuthStateRefresh);

    // Setup 10-second polling interval for live updates
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 10000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('auth-login', handleAuthStateRefresh);
      window.removeEventListener('auth-register', handleAuthStateRefresh);
      window.removeEventListener('auth-switch', handleAuthStateRefresh);
      window.removeEventListener('auth-logout', handleAuthStateRefresh);
    };
  }, [user, fetchNotifications]);

  // ----------------------------------------------------------------
  // MARK AS READ (Optimistic UI update)
  // ----------------------------------------------------------------

  const markAsRead = useCallback(async (id) => {
    if (!id) return;

    const target = notifications.find((n) => n.id === id);
    const wasUnread = target && !target.isRead;

    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(updated.filter((n) => !n.isRead).length);
      saveStoredNotifications(user, updated);
      return updated;
    });

    if (!wasUnread) {
      return;
    }

    if (!localStorage.getItem('token')) {
      return;
    }

    try {
      await ApiService.markNotificationAsRead(id);
    } catch (error) {
      console.error('Failed to mark notification as read on server:', error);
      fetchNotifications(true);
    }
  }, [notifications, fetchNotifications, user]);

  // ----------------------------------------------------------------
  // MARK ALL AS READ (Optimistic UI update)
  // ----------------------------------------------------------------

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, isRead: true }));
      setUnreadCount(0);
      saveStoredNotifications(user, updated);
      return updated;
    });

    if (!localStorage.getItem('token')) {
      return;
    }

    try {
      await ApiService.markAllNotificationsAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read on server:', error);
      fetchNotifications(true);
    }
  }, [fetchNotifications, user]);

  // ----------------------------------------------------------------
  // DELETE SINGLE NOTIFICATION (Optimistic UI update)
  // ----------------------------------------------------------------

  const deleteNotification = useCallback(async (id) => {
    if (!id) return;

    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      setUnreadCount(updated.filter((n) => !n.isRead).length);
      saveStoredNotifications(user, updated);
      return updated;
    });

    if (!localStorage.getItem('token')) {
      return;
    }

    try {
      await ApiService.deleteNotification(id);
    } catch (error) {
      console.error('Failed to delete notification on server:', error);
      fetchNotifications(true);
    }
  }, [fetchNotifications, user]);

  // ----------------------------------------------------------------
  // CLEAR ALL NOTIFICATIONS (Optimistic UI update)
  // ----------------------------------------------------------------

  const clearAllNotifications = useCallback(async () => {
    setNotifications(() => {
      setUnreadCount(0);
      saveStoredNotifications(user, []);
      return [];
    });

    if (!localStorage.getItem('token')) {
      return;
    }

    try {
      await ApiService.deleteAllNotifications();
    } catch (error) {
      console.error('Failed to clear all notifications on server:', error);
      fetchNotifications(true);
    }
  }, [fetchNotifications, user]);

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    toasts,
    showToast,
    dismissToast,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
