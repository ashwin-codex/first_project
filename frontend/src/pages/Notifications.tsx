import React, { useEffect } from 'react';
import { useNotifications as useNotifContext } from '../context/NotificationContext';
import { useToast } from '../components/ui/Toast';
import { GlassCard } from '../components/ui/GlassCard';
import { Bell, AlertTriangle, Calendar, Info, Trash2, CheckSquare } from 'lucide-react';

export const Notifications: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, fetchNotifications } = useNotifContext();
  const { showToast } = useToast();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    try {
      await markAllAsRead();
      showToast('All notifications marked as read', 'success');
    } catch (err) {
      showToast('Failed to update notifications', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      showToast('Notification dismissed', 'success');
    } catch (err) {
      showToast('Failed to delete notification', 'error');
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'budget_exceeded':
        return <AlertTriangle className="w-5 h-5 text-rose-400 mt-0.5" />;
      case 'upcoming_bill':
        return <Calendar className="w-5 h-5 text-amber-400 mt-0.5" />;
      case 'reminder':
        return <Info className="w-5 h-5 text-indigo-400 mt-0.5" />;
      default:
        return <Bell className="w-5 h-5 text-violet-400 mt-0.5" />;
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#0b0f19] overflow-y-auto text-slate-100 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-outfit font-extrabold text-3xl text-white font-bold flex items-center gap-2">
            <Bell className="w-8 h-8 text-brand-500" />
            Alert Notification Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">Review critical budget alerts and billing cycles</p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 border border-white/5 bg-slate-900/60 hover:bg-slate-900 rounded-xl text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition font-semibold"
          >
            <CheckSquare className="w-4 h-4" />
            Mark All as Read
          </button>
        )}
      </div>

      <div className="max-w-3xl">
        <GlassCard className="p-0 overflow-hidden">
          {notifications.length === 0 ? (
            <div className="text-center py-20 text-slate-500 text-sm">
              <Bell className="w-10 h-10 mx-auto text-slate-700 mb-3" />
              You're all caught up! No notifications yet.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => !n.isRead && markAsRead(n._id)}
                  className={`p-5 flex gap-4 hover:bg-white/5 transition cursor-pointer relative ${
                    !n.isRead ? 'bg-brand-500/5' : ''
                  }`}
                >
                  {/* Left Accent indicator for unread */}
                  {!n.isRead && (
                    <span className="absolute left-0 inset-y-0 w-1 bg-brand-500" />
                  )}

                  <div className="flex-shrink-0">
                    {getNotifIcon(n.type)}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm text-white">{n.title}</h4>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      {n.message}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(n._id);
                    }}
                    className="p-1 hover:bg-rose-500/10 rounded text-slate-500 hover:text-rose-400 transition h-fit self-center"
                    title="Dismiss"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};
export default Notifications;
