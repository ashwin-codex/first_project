import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { Bell, Menu, Moon, Sun, User as UserIcon, LogOut, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
  onMenuClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const navigate = useNavigate();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-slate-950/80 backdrop-blur-xl px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center font-bold text-white text-lg shadow-glow">
            P
          </div>
          <span className="font-outfit font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
            Pocket<span className="text-violet-400">Pilot</span>
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border border-white/5 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all duration-200"
          aria-label="Toggle Theme"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* Notifications Icon & Dropdown */}
        {user && (
          <div className="relative">
            <button
              onClick={() => {
                setNotifOpen(!notifOpen);
                setProfileOpen(false);
              }}
              className="p-2.5 rounded-xl border border-white/5 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all duration-200 relative"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-slate-950 animate-pulse" />
              )}
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-3 w-80 rounded-2xl glass-panel border border-white/10 p-4 shadow-2xl z-50 text-slate-200"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    <Link
                      to="/notifications"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs text-brand-400 hover:underline"
                    >
                      View All
                    </Link>
                  </div>

                  <div className="max-h-60 overflow-y-auto flex flex-col gap-2">
                    {notifications.length === 0 ? (
                      <p className="text-center py-6 text-slate-500 text-xs">No notifications yet.</p>
                    ) : (
                      notifications.slice(0, 4).map((n) => (
                        <div
                          key={n._id}
                          onClick={() => {
                            markAsRead(n._id);
                            navigate('/notifications');
                            setNotifOpen(false);
                          }}
                          className={`p-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer text-left border ${
                            !n.isRead ? 'border-brand-500/20 bg-brand-500/5' : 'border-transparent'
                          }`}
                        >
                          <h4 className="font-medium text-xs text-white">{n.title}</h4>
                          <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Profile Avatar & Actions */}
        {user && (
          <div className="relative">
            <button
              onClick={() => {
                setProfileOpen(!profileOpen);
                setNotifOpen(false);
              }}
              className="flex items-center gap-2 p-1.5 rounded-xl border border-white/5 hover:bg-slate-900/60 transition-all duration-200"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-lg object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center font-bold text-white text-xs">
                  {user.name.charAt(0)}
                </div>
              )}
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-3 w-56 rounded-2xl glass-panel border border-white/10 p-2 shadow-2xl z-50 text-slate-200"
                >
                  <div className="px-3 py-2 border-b border-white/5 mb-1.5 text-left">
                    <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all text-left"
                  >
                    <UserIcon className="w-4 h-4" />
                    Profile
                  </Link>

                  <Link
                    to="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all text-left"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-rose-400 hover:bg-rose-500/10 transition-all text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </header>
  );
};
export default Navbar;
