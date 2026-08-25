import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  X,
  CreditCard,
  Calendar,
  Star,
  Building2,
  Info,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

function getToastVisuals(toast) {
  const category = toast.category || 'system';
  const title = (toast.title || '').toLowerCase();

  if (category === 'payment' || title.includes('payment') || title.includes('paid')) {
    return {
      icon: CreditCard,
      borderColor: 'border-emerald-500',
      iconBg: 'bg-emerald-100 text-emerald-700',
      accentColor: 'text-emerald-700',
      badge: 'Payment',
    };
  }

  if (category === 'reservation' || title.includes('reservation') || title.includes('check')) {
    return {
      icon: Calendar,
      borderColor: 'border-[#043658]',
      iconBg: 'bg-blue-100 text-[#043658]',
      accentColor: 'text-[#043658]',
      badge: 'Booking',
    };
  }

  if (category === 'review' || title.includes('review') || title.includes('rating')) {
    return {
      icon: Star,
      borderColor: 'border-amber-500',
      iconBg: 'bg-amber-100 text-amber-700',
      accentColor: 'text-amber-700',
      badge: 'Review',
    };
  }

  if (category === 'guesthouse' || title.includes('approved') || title.includes('rejected')) {
    return {
      icon: Building2,
      borderColor: 'border-purple-500',
      iconBg: 'bg-purple-100 text-purple-700',
      accentColor: 'text-purple-700',
      badge: 'Property',
    };
  }

  return {
    icon: Bell,
    borderColor: 'border-stone-400',
    iconBg: 'bg-stone-100 text-stone-700',
    accentColor: 'text-stone-800',
    badge: 'Alert',
  };
}

export function NotificationToastContainer() {
  const { toasts, dismissToast, markAsRead } = useNotifications();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!toasts || toasts.length === 0) {
    return null;
  }

  const handleToastClick = (toast) => {
    if (toast.notificationId) {
      markAsRead(toast.notificationId);
    }
    dismissToast(toast.id);

    const userRole = String(user?.role || '').toUpperCase();
    const title = (toast.title || '').toLowerCase();

    if (userRole === 'GUEST') {
      navigate('/reservations');
    } else if (userRole === 'OWNER') {
      if (title.includes('payment') || title.includes('revenue')) {
        navigate('/owner/revenue');
      } else {
        navigate('/owner');
      }
    } else if (userRole === 'RECEPTIONIST') {
      navigate('/receptionist');
    } else if (userRole === 'ADMIN') {
      navigate('/admin');
    }
  };

  return (
    <aside
      aria-label="Notifications"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const visuals = getToastVisuals(toast);
        const VisualIcon = visuals.icon;

        return (
          <div
            key={toast.id}
            onClick={() => handleToastClick(toast)}
            className={`pointer-events-auto cursor-pointer rounded-2xl border-l-4 ${visuals.borderColor} bg-white p-4 shadow-2xl ring-1 ring-stone-900/10 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] flex items-start gap-3 animate-in slide-in-from-bottom-5 fade-in`}
          >
            {/* ICON */}
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${visuals.iconBg}`}
            >
              <VisualIcon className="h-5 w-5" />
            </div>

            {/* TEXT CONTENT */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider ${visuals.accentColor}`}
                >
                  {visuals.badge}
                </span>
                <span className="text-[10px] font-medium text-stone-400">
                  Just now
                </span>
              </div>

              <h4 className="mt-0.5 text-xs font-bold text-stone-900 truncate">
                {toast.title}
              </h4>

              <p className="mt-1 text-xs text-stone-600 line-clamp-2 leading-relaxed">
                {toast.message}
              </p>
            </div>

            {/* DISMISS BUTTON */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                dismissToast(toast.id);
              }}
              className="rounded-lg p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </aside>
  );
}

export default NotificationToastContainer;
