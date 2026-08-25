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

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
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
      knownIdsRef.current.clear();
      isFirstLoadRef.current = true;
      return;
    }

    if (!isPolling) {
      setLoading(true);
    }

    try {
      const data = await ApiService.getNotifications();
      const list = Array.isArray(data) ? data : [];

      // Calculate unread count
      const count = list.filter((n) => !n.isRead).length;

      // Check for newly arrived notifications to pop up a toast alert
      if (!isFirstLoadRef.current && isPolling) {
        const newUnread = list.filter(
          (n) => !n.isRead && !knownIdsRef.current.has(n.id)
        );

        if (newUnread.length > 0) {
          // Show toast alert for new notifications
          newUnread.slice(0, 2).forEach((n) => {
            showToast(n);
          });
        }
      }

      // Update known IDs
      const currentIds = new Set(list.map((n) => n.id));
      knownIdsRef.current = currentIds;
      isFirstLoadRef.current = false;

      setNotifications(list);
      setUnreadCount(count);
    } catch (error) {
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
      knownIdsRef.current.clear();
      isFirstLoadRef.current = true;
      return;
    }

    // Initial load
    fetchNotifications(false);

    // Setup 10-second polling interval for live updates
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [user, fetchNotifications]);

  // ----------------------------------------------------------------
  // MARK AS READ (Optimistic UI update)
  // ----------------------------------------------------------------

  const markAsRead = useCallback(async (id) => {
    if (!id) return;

    // Optimistic state update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await ApiService.markNotificationAsRead(id);
    } catch (error) {
      console.error('Failed to mark notification as read on server:', error);
      // Re-fetch to sync if failed
      fetchNotifications(true);
    }
  }, [fetchNotifications]);

  // ----------------------------------------------------------------
  // MARK ALL AS READ (Optimistic UI update)
  // ----------------------------------------------------------------

  const markAllAsRead = useCallback(async () => {
    // Optimistic state update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await ApiService.markAllNotificationsAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read on server:', error);
      fetchNotifications(true);
    }
  }, [fetchNotifications]);

  // ----------------------------------------------------------------
  // DELETE SINGLE NOTIFICATION (Optimistic UI update)
  // ----------------------------------------------------------------

  const deleteNotification = useCallback(async (id) => {
    if (!id) return;

    const target = notifications.find((n) => n.id === id);
    const wasUnread = target && !target.isRead;

    // Optimistic state update
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (wasUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await ApiService.deleteNotification(id);
    } catch (error) {
      console.error('Failed to delete notification on server:', error);
      fetchNotifications(true);
    }
  }, [notifications, fetchNotifications]);

  // ----------------------------------------------------------------
  // CLEAR ALL NOTIFICATIONS (Optimistic UI update)
  // ----------------------------------------------------------------

  const clearAllNotifications = useCallback(async () => {
    // Optimistic state update
    setNotifications([]);
    setUnreadCount(0);

    try {
      await ApiService.deleteAllNotifications();
    } catch (error) {
      console.error('Failed to clear all notifications on server:', error);
      fetchNotifications(true);
    }
  }, [fetchNotifications]);

  const value = {
    notifications,
    unreadCount,
    loading,
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
