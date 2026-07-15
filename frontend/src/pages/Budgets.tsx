import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { GlassCard } from '../components/ui/GlassCard';
import { PiggyBank, Sparkles, Plus, Trash2, Loader2, ArrowRight } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface BudgetProgress {
  id: string;
  category: string;
  limit: number;
  spent: number;
  period: string;
}

export const Budgets: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [progressList, setProgressList] = useState<BudgetProgress[]>([]);
  const [aiTips, setAiTips] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Budget Setup Input States
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7)); // "YYYY-MM"
  const [category, setCategory] = useState('Food');
  const [limit, setLimit] = useState('');

  const categories = [
    'Food', 'Rent/Mortgage', 'Utilities', 'Entertainment',
    'Transport', 'Healthcare', 'Shopping', 'Other'
  ];

  const fetchBudgetProgress = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/budgets/progress?period=${period}`);
      setProgressList(res.data.progress);
      setAiTips(res.data.aiSuggestions);
    } catch (error) {
      console.error(error);
      showToast('Failed to load budget progress metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetProgress();
  }, [period]);

  const handleUpsertBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!limit || parseFloat(limit) <= 0) {
      showToast('Please specify a positive budget limit.', 'error');
      return;
    }

    setSaving(true);
    try {
      await API.post('/budgets', {
        category,
        limit: parseFloat(limit),
        period
      });
      showToast(`Monthly limit for ${category} updated successfully`, 'success');
      setLimit('');
      fetchBudgetProgress();
    } catch (error) {
      showToast('Failed to save budget limit category', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (id === 'unbudgeted') return;
    if (!window.confirm('Remove this category budget configuration?')) return;
    try {
      await API.delete(`/budgets/${id}`);
      showToast('Budget category limit removed', 'success');
      fetchBudgetProgress();
    } catch (error) {
      showToast('Failed to delete budget limit config', 'error');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(user?.language || 'en-US', {
      style: 'currency',
      currency: user?.currency || 'USD'
    }).format(val);
  };

  // Compile Chart Data (Exclude category items where limit is 0 and spent is 0 to avoid clutter)
  const chartData = progressList
    .filter((p) => p.limit > 0 || p.spent > 0)
    .map((p) => ({
      name: p.category,
      Limit: p.limit,
      ActualSpent: p.spent
    }));

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#0b0f19] overflow-y-auto text-slate-100 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-outfit font-extrabold text-3xl text-white font-bold">Category Budgets</h1>
          <p className="text-slate-400 text-sm mt-1">Configure spending limits and compare limits vs actual outflows</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Period:</span>
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-white/5 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* AI Budget Recommendations */}
      {aiTips.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/20 shadow-glow relative overflow-hidden">
          <div className="absolute -right-24 -top-24 w-40 h-40 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <h4 className="text-xs font-bold text-violet-400 uppercase tracking-widest">AI Budget Adjustments</h4>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {aiTips.map((tip, idx) => (
              <div key={idx} className="p-3.5 bg-slate-900/60 border border-white/5 rounded-xl text-xs text-slate-200 leading-relaxed font-medium">
                {tip}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Setup Budget Card */}
        <div className="flex flex-col gap-6">
          <GlassCard>
            <h3 className="font-outfit font-bold text-lg text-white mb-4">Set Category Target</h3>
            <form onSubmit={handleUpsertBudget} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 font-semibold uppercase">Category Name</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="py-2.5 px-3 bg-slate-950/60 border border-white/5 rounded-xl text-sm text-white focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 font-semibold uppercase">Monthly Cap ({user?.currency || 'USD'})</label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  required
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  className="py-2.5 px-3 bg-slate-950/60 border border-white/5 rounded-xl text-sm text-white focus:outline-none font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-xs font-bold text-white rounded-xl shadow-glow transition duration-300 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Configure Limit
                  </>
                )}
              </button>
            </form>
          </GlassCard>

          {/* Quick Summary card */}
          <GlassCard className="flex flex-col items-center justify-center p-6 bg-brand-500/5">
            <PiggyBank className="w-10 h-10 text-brand-400 mb-2" />
            <h4 className="font-outfit font-bold text-sm text-white">Why budget categories?</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-[220px] text-center">
              PocketPilot monitors your transactions in real-time. If you overspend your set targets, we will auto-generate alerts.
            </p>
          </GlassCard>
        </div>

        {/* Budget List Ratios */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Ledger */}
          <GlassCard className="flex-1 flex flex-col justify-between">
            <h3 className="font-outfit font-bold text-lg text-white mb-4">Goal Ratios</h3>
            {loading ? (
              <div className="py-16 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
              </div>
            ) : progressList.length === 0 ? (
              <p className="text-center py-16 text-slate-500 text-sm">No category limits set up for this month.</p>
            ) : (
              <div className="space-y-4">
                {progressList.map((prog) => {
                  const percent = prog.limit > 0 ? (prog.spent / prog.limit) * 100 : 100;
                  const isOver = prog.limit > 0 && prog.spent > prog.limit;
                  const isUnbudgeted = prog.limit === 0;

                  return (
                    <div key={prog.category} className="p-3 bg-slate-900/40 border border-white/5 rounded-xl flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-xs text-white capitalize">{prog.category}</span>
                          {isUnbudgeted && (
                            <span className="ml-2 text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full uppercase">
                              Unbudgeted
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-slate-300">
                            {formatCurrency(prog.spent)}
                            {!isUnbudgeted && ` / ${formatCurrency(prog.limit)}`}
                          </span>
                          {!isUnbudgeted && (
                            <button
                              onClick={() => handleDeleteBudget(prog.id)}
                              className="p-1 hover:bg-rose-500/10 rounded text-slate-500 hover:text-rose-400 transition"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Visual progress bar */}
                      {!isUnbudgeted && (
                        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isOver ? 'bg-rose-500' : percent >= 80 ? 'bg-amber-400' : 'bg-brand-500'
                            }`}
                            style={{ width: `${Math.min(100, percent)}%` }}
                          />
                        </div>
                      )}

                      {!isUnbudgeted && (
                        <div className="flex justify-between items-center text-[10px]">
                          <span className={isOver ? 'text-rose-400 font-bold' : 'text-slate-500'}>
                            {percent.toFixed(0)}% Consumed
                          </span>
                          {isOver && (
                            <span className="text-rose-400 font-semibold uppercase tracking-wider">
                              Exceeded limit!
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>

          {/* Budget vs Actual Graph */}
          {chartData.length > 0 && (
            <GlassCard className="min-h-[300px]">
              <h3 className="font-outfit font-bold text-lg text-white mb-4">Budget vs. Actual Spending</h3>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} />
                    <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: 'rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                        color: '#f8fafc'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="Limit" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="ActualSpent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
};
export default Budgets;
