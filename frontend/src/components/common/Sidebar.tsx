import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  Bot,
  BarChart3,
  Bell,
  User,
  Settings,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', path: '/transactions', icon: Receipt },
    { name: 'Budgets', path: '/budgets', icon: PiggyBank },
    { name: 'AI Wealth Coach', path: '/ai-chat', icon: Bot },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-white/5 bg-slate-950/95 p-5 flex flex-col justify-between transform transition-transform duration-300 lg:translate-x-0 lg:static ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between lg:hidden border-b border-white/5 pb-3">
            <span className="font-outfit font-extrabold text-lg text-white">Menu Navigation</span>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-250 ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-600/20 to-brand-500/10 border-l-4 border-brand-500 text-white shadow-glow'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border-l-4 border-transparent'
                  }`
                }
              >
                <item.icon className="w-4 h-5 flex-shrink-0" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="border-t border-white/5 pt-4 text-center">
          <p className="text-[11px] text-slate-500 font-mono">PocketPilot v1.0.0</p>
        </div>
      </aside>
    </>
  );
};
export default Sidebar;
