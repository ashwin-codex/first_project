import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { GlassCard } from '../components/ui/GlassCard';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Sparkles,
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Loader2
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DashboardData {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  savings: number;
  healthScore: number;
  aiSuggestion: string;
  recentTransactions: any[];
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);

  const currency = user?.currency || 'USD';

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await API.get('/transactions/summary');
      setData(res.data);

      // Fetch transaction list to structure charts
      const txRes = await API.get('/transactions?limit=100');
      prepareCharts(txRes.data.transactions);
    } catch (error) {
      console.error(error);
      showToast('Failed to load dashboard summaries', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user]);

  const prepareCharts = (transactions: any[]) => {
    // 1. Prepare Daily Spending/Income Area Chart Data for current month
    const dailyMap: Record<string, { date: string; Income: number; Expense: number }> = {};
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    // Initialize month days
    for (let i = 1; i <= daysInMonth; i++) {
      const dayStr = `${now.getMonth() + 1}/${i}`;
      dailyMap[i] = { date: dayStr, Income: 0, Expense: 0 };
    }

    transactions.forEach((tx) => {
      const txDate = new Date(tx.date);
      if (txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear()) {
        const day = txDate.getDate();
        if (dailyMap[day]) {
          if (tx.type === 'income') {
            dailyMap[day].Income += tx.amount;
          } else if (tx.type === 'expense') {
            dailyMap[day].Expense += tx.amount;
          }
        }
      }
    });

    setChartData(Object.values(dailyMap));

    // 2. Prepare Category Pie Chart Data
    const catMap: Record<string, number> = {};
    transactions.forEach((tx) => {
      const txDate = new Date(tx.date);
      if (tx.type === 'expense' && txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear()) {
        catMap[tx.category] = (catMap[tx.category] || 0) + tx.amount;
      }
    });

    const formattedPie = Object.keys(catMap).map((cat) => ({
      name: cat,
      value: catMap[cat]
    }));
    setPieData(formattedPie);
  };

  const PIE_COLORS = ['#8b5cf6', '#a855f7', '#6366f1', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(user?.language || 'en-US', {
      style: 'currency',
      currency: currency
    }).format(val);
  };

  if (loading && !data) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[#0b0f19]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#0b0f19] overflow-y-auto text-left">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-outfit font-extrabold text-3xl text-white">Hello, {user?.name} 👋</h1>
          <p className="text-slate-400 text-sm mt-1">Here is your financial overview for this month.</p>
        </div>
        <button
          onClick={fetchDashboard}
          className="flex items-center gap-2 px-4 py-2 text-xs border border-white/5 bg-slate-900/60 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Sync Ratios
        </button>
      </div>

      {/* AI Suggestion Ticker */}
      {data?.aiSuggestion && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-500/10 via-brand-500/5 to-fuchsia-500/10 border border-violet-500/20 shadow-glow relative overflow-hidden flex gap-3.5 items-start">
          <div className="absolute -right-16 -top-16 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="w-9 h-9 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-violet-400 uppercase tracking-widest">PocketPilot AI Coach</h4>
            <p className="text-sm text-slate-200 mt-1 font-medium leading-relaxed">"{data.aiSuggestion}"</p>
          </div>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Balance</p>
              <h3 className="text-2xl font-extrabold font-outfit text-white mt-1.5">{formatCurrency(data?.totalBalance || 0)}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
            <span>Overall net accounts wealth</span>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Monthly Income</p>
              <h3 className="text-2xl font-extrabold font-outfit text-emerald-400 mt-1.5">{formatCurrency(data?.monthlyIncome || 0)}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-400/80 font-medium">
            <span>Earnings this calendar month</span>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Monthly Expenses</p>
              <h3 className="text-2xl font-extrabold font-outfit text-rose-400 mt-1.5">{formatCurrency(data?.monthlyExpense || 0)}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-rose-400/80 font-medium">
            <span>Spendings this calendar month</span>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Surplus / Savings</p>
              <h3 className={`text-2xl font-extrabold font-outfit mt-1.5 ${
                (data?.savings || 0) >= 0 ? 'text-indigo-400' : 'text-rose-500'
              }`}>{formatCurrency(data?.savings || 0)}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
            <span>Remaining month liquidity pool</span>
          </div>
        </GlassCard>
      </div>

      {/* Main Charts & Analytics Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Spending Graph */}
        <GlassCard className="lg:col-span-2 flex flex-col justify-between min-h-[350px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-outfit font-bold text-lg text-white">Cash Flow Trends</h3>
              <p className="text-slate-500 text-xs mt-0.5">Daily income vs expense patterns</p>
            </div>
          </div>
          <div className="h-64 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: 'rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      color: '#f8fafc'
                    }}
                  />
                  <Area type="monotone" dataKey="Income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                Not enough transactions registered for this month.
              </div>
            )}
          </div>
        </GlassCard>

        {/* Category Breakdown & Health Score */}
        <div className="flex flex-col gap-6">
          {/* Health Score Gauge */}
          <GlassCard className="flex flex-col items-center text-center justify-center p-6 relative">
            <h3 className="font-outfit font-bold text-sm text-slate-400 uppercase tracking-widest mb-4">Financial Health Score</h3>
            <div className="relative w-36 h-36 flex items-center justify-center mb-2">
              {/* Circular Gauge Border */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  stroke="rgba(255,255,255,0.03)"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  stroke="#8b5cf6"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={377}
                  strokeDashoffset={377 - (377 * (data?.healthScore || 50)) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-extrabold font-outfit text-white">{data?.healthScore}</span>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Scale rating</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 max-w-[200px] mt-2 font-medium">
              {data && data.healthScore >= 80
                ? 'Outstanding! Your wealth metrics are stable and well-budgeted.'
                : data && data.healthScore >= 55
                ? 'Stable. Try enforcing stricter limits on discretionary entertainment.'
                : 'Warning: Savings rate is critical. Consult AI chatbot immediately.'}
            </p>
          </GlassCard>

          {/* Category Pie */}
          <GlassCard className="flex-1 flex flex-col justify-between min-h-[220px]">
            <div className="mb-2">
              <h3 className="font-outfit font-bold text-sm text-white">Expense Distribution</h3>
            </div>
            <div className="h-32 w-full relative">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={45}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: 'rgba(255,255,255,0.08)',
                        borderRadius: '10px',
                        fontSize: '11px',
                        color: '#f8fafc'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  No active expenses recorded.
                </div>
              )}
            </div>
            {/* Color labels list */}
            <div className="flex flex-wrap gap-2.5 justify-center mt-2">
              {pieData.slice(0, 4).map((entry, idx) => (
                <div key={entry.name} className="flex items-center gap-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                  />
                  <span className="text-[10px] text-slate-400 capitalize truncate max-w-[70px]">{entry.name}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Recent Transactions & Actions Table */}
      <GlassCard className="w-full">
        <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-3">
          <div>
            <h3 className="font-outfit font-bold text-lg text-white">Recent Ledger Transactions</h3>
            <p className="text-slate-500 text-xs mt-0.5">Your latest logged finance flows</p>
          </div>
          <Link
            to="/transactions"
            className="flex items-center gap-1.5 text-xs text-brand-400 font-semibold hover:underline"
          >
            Manage All
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {data?.recentTransactions && data.recentTransactions.length > 0 ? (
            <table className="w-full text-sm text-slate-300">
              <thead>
                <tr className="text-slate-500 text-xs font-semibold uppercase border-b border-white/5 text-left">
                  <th className="py-2.5">Date</th>
                  <th className="py-2.5">Description</th>
                  <th className="py-2.5">Category</th>
                  <th className="py-2.5">Type</th>
                  <th className="py-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.recentTransactions.map((tx) => (
                  <tr key={tx._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 text-xs text-slate-400">{new Date(tx.date).toLocaleDateString()}</td>
                    <td className="py-3 font-medium text-white max-w-[150px] truncate">{tx.description || 'Generic transaction'}</td>
                    <td className="py-3 text-xs">
                      <span className="px-2 py-0.5 bg-slate-900 border border-white/5 text-slate-300 rounded-full capitalize">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3 text-xs capitalize">
                      {tx.type === 'income' ? (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          Income
                        </span>
                      ) : tx.type === 'expense' ? (
                        <span className="flex items-center gap-1 text-rose-400">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          Expense
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-brand-400">
                          Transfer
                        </span>
                      )}
                    </td>
                    <td className={`py-3 text-right font-semibold font-mono ${
                      tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center py-8 text-slate-500 text-sm">No transaction ledger recorded yet.</p>
          )}
        </div>
      </GlassCard>
    </div>
  );
};
export default Dashboard;
