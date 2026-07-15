import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/ui/Toast';
import { GlassCard } from '../components/ui/GlassCard';
import { Settings as SettingsIcon, Bell, ShieldAlert, BadgeDollarSign, Globe, Sun, Moon } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const [saving, setSaving] = useState(false);

  // States
  const [currency, setCurrency] = useState(user?.currency || 'USD');
  const [language, setLanguage] = useState(user?.language || 'en');
  const [budgetAlerts, setBudgetAlerts] = useState(user?.notifications?.budgetAlerts ?? true);
  const [billReminders, setBillReminders] = useState(user?.notifications?.billReminders ?? true);
  const [savingsSummary, setSavingsSummary] = useState(user?.notifications?.savingsSummary ?? true);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await updateProfile({
        currency,
        language,
        notifications: {
          budgetAlerts,
          billReminders,
          savingsSummary
        }
      });
      showToast('Settings saved successfully', 'success');
    } catch (err) {
      showToast('Failed to save settings preferences', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#0b0f19] overflow-y-auto text-slate-100 text-left">
      <div className="border-b border-white/5 pb-3">
        <h1 className="font-outfit font-extrabold text-3xl text-white font-bold flex items-center gap-2">
          <SettingsIcon className="w-8 h-8 text-brand-500" />
          System Preferences
        </h1>
        <p className="text-slate-400 text-sm mt-1">Configure currencies, languages, themes and alerts channels</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
        {/* Core preferences */}
        <div className="space-y-6">
          <GlassCard>
            <h3 className="font-outfit font-bold text-md text-white mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-violet-400" />
              Localization Configurations
            </h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 font-semibold uppercase">Primary Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="py-2.5 px-3 bg-slate-950/60 border border-white/5 rounded-xl text-sm text-white focus:outline-none"
                >
                  <option value="USD">USD ($) United States Dollar</option>
                  <option value="EUR">EUR (€) Euro</option>
                  <option value="GBP">GBP (£) Great British Pound</option>
                  <option value="INR">INR (₹) Indian Rupee</option>
                  <option value="JPY">JPY (¥) Japanese Yen</option>
                  <option value="CAD">CAD ($) Canadian Dollar</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 font-semibold uppercase">Preferred Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="py-2.5 px-3 bg-slate-950/60 border border-white/5 rounded-xl text-sm text-white focus:outline-none"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="ja">日本語</option>
                  <option value="hi">हिन्दी</option>
                </select>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="font-outfit font-bold text-md text-white mb-4 flex items-center gap-2">
              {theme === 'dark' ? <Moon className="w-4 h-4 text-violet-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
              Aesthetic Style Theme
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-white">Visual Mode Selection</span>
                <span className="block text-[10px] text-slate-500 mt-0.5">Toggle light or dark modes</span>
              </div>
              <button
                onClick={toggleTheme}
                className="px-4 py-2 bg-slate-900 border border-white/10 hover:bg-slate-800 text-xs font-semibold text-white rounded-lg transition"
              >
                Switch to {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </button>
            </div>
          </GlassCard>
        </div>

        {/* Alerts preferences */}
        <div className="space-y-6">
          <GlassCard>
            <h3 className="font-outfit font-bold text-md text-white mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-violet-400" />
              Notifications Ratios
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <div className="text-left">
                  <span className="text-xs font-semibold text-white">Budget Exceeded Alerts</span>
                  <span className="block text-[10px] text-slate-500 mt-0.5">Receive warning when category caps are breached</span>
                </div>
                <input
                  type="checkbox"
                  checked={budgetAlerts}
                  onChange={(e) => setBudgetAlerts(e.target.checked)}
                  className="w-4 h-4 rounded accent-brand-500"
                />
              </div>

              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <div className="text-left">
                  <span className="text-xs font-semibold text-white">Upcoming Bill Reminders</span>
                  <span className="block text-[10px] text-slate-500 mt-0.5">Receive alarms 3 days prior to recurring charges</span>
                </div>
                <input
                  type="checkbox"
                  checked={billReminders}
                  onChange={(e) => setBillReminders(e.target.checked)}
                  className="w-4 h-4 rounded accent-brand-500"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="text-left">
                  <span className="text-xs font-semibold text-white">Savings Goal Summary Alerts</span>
                  <span className="block text-[10px] text-slate-500 mt-0.5">Receive notifications on reaching milestones</span>
                </div>
                <input
                  type="checkbox"
                  checked={savingsSummary}
                  onChange={(e) => setSavingsSummary(e.target.checked)}
                  className="w-4 h-4 rounded accent-brand-500"
                />
              </div>
            </div>
          </GlassCard>

          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="w-full py-4 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-sm font-bold text-white rounded-xl shadow-glow transition duration-300 flex items-center justify-center gap-2"
          >
            {saving ? 'Saving preferences...' : 'Apply Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};
export default Settings;
