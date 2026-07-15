import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { GlassCard } from '../components/ui/GlassCard';
import { BarChart3, Download, TrendingUp, HelpCircle, Loader2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

interface AnalyticTx {
  type: 'income' | 'expense' | 'transfer';
  category: string;
  amount: number;
  date: string;
  description: string;
}

export const Analytics: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [list, setList] = useState<AnalyticTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthData, setMonthData] = useState<any[]>([]);
  const [savingsTrend, setSavingsTrend] = useState<any[]>([]);

  const currency = user?.currency || 'USD';

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      // Fetch maximum records to compute trends (limit 500)
      const res = await API.get('/transactions?limit=500');
      const txs: AnalyticTx[] = res.data.transactions;
      setList(txs);
      prepareTrends(txs);
    } catch (error) {
      console.error(error);
      showToast('Failed to load transaction archives', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [user]);

  const prepareTrends = (txs: AnalyticTx[]) => {
    // 1. Group income vs expenses by month
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const monthlySummaryMap: Record<number, { name: string; Income: number; Expense: number }> = {};

    // Prepopulate last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = d.getMonth();
      const mYear = d.getFullYear();
      const key = mYear * 12 + mIdx; // Unique month identifier
      monthlySummaryMap[key] = {
        name: `${months[mIdx]} ${mYear.toString().slice(-2)}`,
        Income: 0,
        Expense: 0
      };
    }

    txs.forEach((tx) => {
      const d = new Date(tx.date);
      const key = d.getFullYear() * 12 + d.getMonth();
      if (monthlySummaryMap[key]) {
        if (tx.type === 'income') {
          monthlySummaryMap[key].Income += tx.amount;
        } else if (tx.type === 'expense') {
          monthlySummaryMap[key].Expense += tx.amount;
        }
      }
    });

    const monthList = Object.values(monthlySummaryMap);
    setMonthData(monthList);

    // 2. Cumulative Savings Growth calculation
    let cumulative = 0;
    const savingsGrowth = monthList.map((m) => {
      const saving = m.Income - m.Expense;
      cumulative += saving;
      return {
        name: m.name,
        SavingsPool: cumulative
      };
    });
    setSavingsTrend(savingsGrowth);
  };

  const handleExportCSV = () => {
    if (list.length === 0) {
      showToast('No ledger transactions available for export.', 'error');
      return;
    }

    // Define CSV header
    let csvContent = 'data:text/csv;charset=utf-8,Date,Type,Category,Description,Amount\n';

    list.forEach((tx) => {
      const row = [
        new Date(tx.date).toLocaleDateString(),
        tx.type,
        tx.category,
        `"${tx.description.replace(/"/g, '""')}"`,
        tx.amount
      ].join(',');
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pocketpilot_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Financial report exported successfully as CSV', 'success');
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(user?.language || 'en-US', {
      style: 'currency',
      currency: currency
    }).format(val);
  };

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#0b0f19] overflow-y-auto text-slate-100 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-outfit font-extrabold text-3xl text-white font-bold flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-brand-500" />
            Financial Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">Review monthly trends and export ledger files</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-900 border border-white/10 text-sm font-bold text-slate-200 hover:text-white flex items-center gap-2 transition"
        >
          <Download className="w-4 h-4" />
          Export Ledger (CSV)
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : list.length === 0 ? (
        <p className="text-center py-20 text-slate-500 text-sm">Please register transactions to build trend analytics.</p>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Monthly Income vs Expense Bar Chart */}
          <GlassCard className="min-h-[350px]">
            <h3 className="font-outfit font-bold text-lg text-white mb-2">Monthly Cash Flow Ratios</h3>
            <p className="text-slate-500 text-xs mb-4">Comparison of monthly income against expenses</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Savings growth line graph */}
          <GlassCard className="min-h-[350px]">
            <h3 className="font-outfit font-bold text-lg text-white mb-2">Savings Growth Pool</h3>
            <p className="text-slate-500 text-xs mb-4">Cumulative net savings progress over the last 6 months</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={savingsTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  <Line type="monotone" dataKey="SavingsPool" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Analytics Summary */}
          <GlassCard className="lg:col-span-2">
            <h3 className="font-outfit font-bold text-lg text-white mb-4">Wealth Trend Audits</h3>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="p-4 bg-slate-900/60 border border-white/5 rounded-xl">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Logged Items</span>
                <span className="block text-2xl font-bold text-white mt-1">{list.length}</span>
              </div>
              <div className="p-4 bg-slate-900/60 border border-white/5 rounded-xl">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Average Savings Rate</span>
                <span className="block text-2xl font-bold text-emerald-400 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-5 h-5" />
                  {monthData.length > 0
                    ? `${(
                        (monthData.reduce((acc, curr) => acc + (curr.Income - curr.Expense), 0) /
                          (monthData.reduce((acc, curr) => acc + curr.Income, 0) || 1)) *
                        100
                      ).toFixed(0)}%`
                    : '0%'}
                </span>
              </div>
              <div className="p-4 bg-slate-900/60 border border-white/5 rounded-xl flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-brand-400 mt-0.5" />
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  Saving Rates above 20% place you in the upper echelon of financial health compliance. Consider automated transfers.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
export default Analytics;
