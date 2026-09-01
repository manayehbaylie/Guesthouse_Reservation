import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Calendar,
  CreditCard,
  Star,
  Building2,
  Shield,
  Info,
  Clock,
  ExternalLink,
  X,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

// Format relative time helper
function formatRelativeTime(dateString) {
  if (!dateString) return 'Just now';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 45) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Recently';
  }
}

// Get icon and color scheme based on notification category and content
function getNotificationVisuals(notification) {
  const category = notification.category || 'system';
  const title = (notification.title || '').toLowerCase();
  const message = (notification.message || '').toLowerCase();

  // ✅ Review response detection
  if (category === 'review_response' || 
      title.includes('responded') || 
      message.includes('responded to your review')) {
    return {
      icon: MessageSquare,
      bgColor: 'bg-purple-50 text-purple-600 border-purple-200',
      badgeColor: 'bg-purple-600',
      tag: 'Review Response',
    };
  }

  if (category === 'payment' || title.includes('payment') || title.includes('paid')) {
    return {
      icon: CreditCard,
      bgColor: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      badgeColor: 'bg-emerald-600',
      tag: 'Payment',
    };
  }

  if (category === 'reservation' || title.includes('reservation') || title.includes('check')) {
    return {
      icon: Calendar,
      bgColor: 'bg-blue-50 text-[#043658] border-blue-200',
      badgeColor: 'bg-[#043658]',
      tag: 'Booking',
    };
  }

  if (category === 'review' || title.includes('review') || title.includes('rating')) {
    return {
      icon: Star,
      bgColor: 'bg-amber-50 text-amber-600 border-amber-200',
      badgeColor: 'bg-amber-500',
      tag: 'Review',
    };
  }

  if (
    category === 'guesthouse' ||
    title.includes('approved') ||
    title.includes('rejected') ||
    title.includes('staff')
  ) {
    return {
      icon: Building2,
      bgColor: 'bg-purple-50 text-purple-700 border-purple-200',
      badgeColor: 'bg-purple-600',
      tag: 'Property',
    };
  }

  return {
    icon: Info,
    bgColor: 'bg-stone-100 text-stone-700 border-stone-200',
    badgeColor: 'bg-stone-600',
    tag: 'System',
  };
}

export function NotificationBell({ variant = 'navbar' }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!user) {
    return null;
  }

  const filteredNotifications =
    activeTab === 'unread'
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  // Handle clicking on a notification item
  const handleItemClick = (item) => {
    if (!item.isRead) {
      markAsRead(item.id);
    }

    const title = (item.title || '').toLowerCase();
    const msg = (item.message || '').toLowerCase();
    const userRole = String(user?.role || '').toUpperCase();

    // Smart routing based on notification content and user role
    if (userRole === 'GUEST') {
      // ✅ If review response, go to guest reviews
      if (title.includes('responded') || title.includes('review') || msg.includes('responded to your review')) {
        navigate('/guest/reviews');
      } else {
        navigate('/reservations');
      }
    } else if (userRole === 'OWNER') {
      if (title.includes('payment') || title.includes('revenue')) {
        navigate('/owner/revenue');
      } else if (title.includes('staff')) {
        navigate('/owner/staff');
      } else if (title.includes('guesthouse') || title.includes('approved')) {
        navigate('/owner/guesthouse');
      } else {
        navigate('/owner');
      }
    } else if (userRole === 'RECEPTIONIST') {
      navigate('/receptionist');
    } else if (userRole === 'ADMIN') {
      navigate('/admin');
    }

    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        title="Notifications"
        className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 focus:outline-none ${
          isOpen
            ? 'bg-[#043658] text-white shadow-sm ring-2 ring-[#043658]/20'
            : variant === 'dark'
            ? 'bg-stone-800 text-stone-200 hover:bg-stone-700 hover:text-white'
            : 'bg-stone-100 text-stone-700 hover:bg-stone-200 hover:text-[#043658]'
        }`}
      >
        <Bell className="h-5 w-5" />

        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white shadow-md ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-stone-200 bg-white shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-100 bg-[#043658] px-4 py-3.5 text-white">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-[#FFC107]">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">Notifications</h3>
              </div>
              {unreadCount > 0 && (
                <span className="rounded-full bg-[#FFC107] px-2 py-0.5 text-[10px] font-extrabold text-[#043658]">
                  {unreadCount} New
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Refresh Button */}
              <button
                type="button"
                onClick={() => fetchNotifications(false)}
                disabled={loading}
                title="Refresh notifications"
                className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {/* Mark All As Read Button */}
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  title="Mark all as read"
                  className="flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-xs font-semibold text-white transition hover:bg-white/20"
                >
                  <CheckCheck className="h-3.5 w-3.5 text-[#FFC107]" />
                  <span className="text-[11px]">Read all</span>
                </button>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Tabs & Actions Bar */}
          <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/80 px-4 py-2 text-xs">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                  activeTab === 'all'
                    ? 'bg-white text-[#043658] shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('unread')}
                className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                  activeTab === 'unread'
                    ? 'bg-white text-[#043658] shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={clearAllNotifications}
                title="Clear all notifications"
                className="flex items-center gap-1 text-[11px] font-semibold text-stone-400 transition hover:text-red-600"
              >
                <Trash2 className="h-3 w-3" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] divide-y divide-stone-100 overflow-y-auto overscroll-contain">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400 mb-3">
                  <Bell className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-stone-800">
                  {activeTab === 'unread'
                    ? 'No unread notifications'
                    : 'No notifications yet'}
                </p>
                <p className="mt-1 text-xs text-stone-500 max-w-[220px]">
                  {activeTab === 'unread'
                    ? 'All your notifications have been marked as read.'
                    : 'When owners respond to your reviews or you receive updates, they will appear here.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const visuals = getNotificationVisuals(item);
                const VisualIcon = visuals.icon;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`group relative flex cursor-pointer gap-3 p-3.5 transition-all hover:bg-stone-50 ${
                      !item.isRead
                        ? 'bg-blue-50/40'
                        : 'bg-white'
                    }`}
                  >
                    {/* Category Icon */}
                    <div className="relative shrink-0">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl border ${visuals.bgColor}`}
                      >
                        <VisualIcon className="h-4 w-4" />
                      </div>
                      {!item.isRead && (
                        <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#FFC107] ring-2 ring-white" />
                      )}
                    </div>

                    {/* Content Body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4
                          className={`text-xs truncate ${
                            !item.isRead
                              ? 'font-bold text-stone-900'
                              : 'font-semibold text-stone-700'
                          }`}
                        >
                          {item.title}
                        </h4>
                        <span className="shrink-0 text-[10px] font-medium text-stone-400 flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>

                      {/* ✅ SHOW FULL MESSAGE - NO TRUNCATION */}
                      <p className="mt-1 text-xs leading-relaxed text-stone-600">
                        {item.message}
                      </p>

                      {/* ✅ "View Full Response" button for review responses */}
                      {item.category === 'review_response' && (
                        <button
                          onClick={() => {
                            markAsRead(item.id);
                            navigate('/guest/reviews');
                            setIsOpen(false);
                          }}
                          className="mt-2 px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 text-[10px] font-bold rounded-lg transition"
                        >
                          View Full Response →
                        </button>
                      )}

                      {/* Quick Actions */}
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span
                          className={`inline-block rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            !item.isRead
                              ? 'bg-[#043658]/10 text-[#043658]'
                              : 'bg-stone-100 text-stone-500'
                          }`}
                        >
                          {visuals.tag}
                        </span>

                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                          {!item.isRead && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(item.id);
                              }}
                              title="Mark as read"
                              className="rounded p-1 text-stone-400 hover:bg-stone-200 hover:text-emerald-600"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(item.id);
                            }}
                            title="Delete notification"
                            className="rounded p-1 text-stone-400 hover:bg-stone-200 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-stone-100 bg-stone-50 px-4 py-2.5 text-center">
            <p className="text-[11px] font-medium text-stone-500">
              Live updates enabled • Auto-syncing with server
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;