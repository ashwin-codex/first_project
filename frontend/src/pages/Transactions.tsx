import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { GlassCard } from '../components/ui/GlassCard';
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  X,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';

interface Transaction {
  _id: string;
  type: 'income' | 'expense' | 'transfer';
  category: string;
  amount: number;
  date: string;
  description: string;
  accountFrom?: string;
  accountTo?: string;
  isRecurring: boolean;
  recurringFrequency?: string;
}

export const Transactions: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [list, setList] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filter States
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Overlay / Form States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState({
    type: 'expense',
    category: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    description: '',
    isRecurring: false,
    recurringFrequency: 'monthly'
  });

  const categories = [
    'Salary', 'Freelance', 'Investments', 'Food', 'Rent/Mortgage',
    'Utilities', 'Entertainment', 'Transport', 'Healthcare', 'Shopping', 'Other'
  ];

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', '10');
      if (search) queryParams.append('search', search);
      if (type) queryParams.append('type', type);
      if (category) queryParams.append('category', category);
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      const res = await API.get(`/transactions?${queryParams.toString()}`);
      setList(res.data.transactions);
      setTotalPages(res.data.pagination.pages);
    } catch (error) {
      console.error(error);
      showToast('Failed to load transactions list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, type, category, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const handleOpenAddModal = () => {
    setEditingTx(null);
    setFormData({
      type: 'expense',
      category: categories[3], // Food
      amount: '',
      date: new Date().toISOString().slice(0, 10),
      description: '',
      isRecurring: false,
      recurringFrequency: 'monthly'
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (tx: Transaction) => {
    setEditingTx(tx);
    setFormData({
      type: tx.type,
      category: tx.category,
      amount: tx.amount.toString(),
      date: new Date(tx.date).toISOString().slice(0, 10),
      description: tx.description || '',
      isRecurring: tx.isRecurring,
      recurringFrequency: tx.recurringFrequency || 'monthly'
    });
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || !formData.amount) {
      showToast('Please fill in category and amount fields', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      if (editingTx) {
        await API.put(`/transactions/${editingTx._id}`, payload);
        showToast('Transaction updated successfully', 'success');
      } else {
        await API.post('/transactions', payload);
        showToast('Transaction registered successfully', 'success');
      }
      setModalOpen(false);
      fetchTransactions();
    } catch (error: any) {
      const responseMsg = error.response?.data?.message || 'Failed to save transaction record';
      showToast(responseMsg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this transaction record?')) return;
    try {
      await API.delete(`/transactions/${id}`);
      showToast('Transaction deleted successfully', 'success');
      fetchTransactions();
    } catch (error) {
      showToast('Failed to delete transaction record', 'error');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setType('');
    setCategory('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(user?.language || 'en-US', {
      style: 'currency',
      currency: user?.currency || 'USD'
    }).format(val);
  };

  return (
    <div className="flex-1 p-6 space-y-6 bg-[#0b0f19] overflow-y-auto text-slate-100 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-outfit font-extrabold text-3xl text-white font-bold">Ledger Transactions</h1>
          <p className="text-slate-400 text-sm mt-1">Manage and audit your complete wealth history logs</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-sm font-bold text-white shadow-glow flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          Add Transaction
        </button>
      </div>

      {/* Filter Options Section */}
      <GlassCard className="p-4 flex flex-col gap-4">
        <form onSubmit={handleSearchSubmit} className="grid md:grid-cols-4 gap-4 items-end">
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Search Keywords</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search descriptions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950/60 border border-white/5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Operation Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="py-2.5 px-3 bg-slate-950/60 border border-white/5 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-brand-500 transition-colors capitalize"
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="py-2.5 px-3 bg-slate-950/60 border border-white/5 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-brand-500 transition-colors capitalize"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/5 pt-4">
          <div className="flex flex-wrap items-center gap-4 text-left">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Start Date</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-950/60 border border-white/5 rounded-lg text-xs text-slate-300 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">End Date</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-950/60 border border-white/5 rounded-lg text-xs text-slate-300 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-white/5 bg-slate-950/40 hover:bg-slate-900 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition"
            >
              Clear Filters
            </button>
            <button
              onClick={() => { setPage(1); fetchTransactions(); }}
              className="px-4 py-2 bg-slate-900 border border-white/5 text-slate-300 hover:text-white rounded-lg text-xs transition"
            >
              Apply Filter
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Transaction Table */}
      <GlassCard className="p-0 overflow-hidden">
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          </div>
        ) : list.length === 0 ? (
          <p className="text-center py-20 text-slate-500 text-sm">No transaction records match criteria.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-slate-300 text-left">
              <thead>
                <tr className="text-slate-500 text-xs font-semibold uppercase border-b border-white/5 bg-slate-950/30">
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">Description</th>
                  <th className="py-3.5 px-6">Category</th>
                  <th className="py-3.5 px-6">Type</th>
                  <th className="py-3.5 px-6 text-right">Amount</th>
                  <th className="py-3.5 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((tx) => (
                  <tr key={tx._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 text-xs text-slate-400">
                      {new Date(tx.date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 font-medium text-white max-w-[200px] truncate">
                      {tx.description || 'Generic ledger record'}
                      {tx.isRecurring && (
                        <span className="ml-2 text-[9px] bg-brand-500/10 text-brand-400 px-1.5 py-0.5 rounded-full capitalize">
                          {tx.recurringFrequency}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-xs">
                      <span className="px-2 py-0.5 bg-slate-900 border border-white/5 text-slate-300 rounded-full capitalize">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs capitalize">
                      {tx.type === 'income' ? (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <TrendingUp className="w-3.5 h-3.5" />
                          Income
                        </span>
                      ) : tx.type === 'expense' ? (
                        <span className="flex items-center gap-1 text-rose-400">
                          <TrendingDown className="w-3.5 h-3.5" />
                          Expense
                        </span>
                      ) : (
                        <span className="text-brand-400">Transfer</span>
                      )}
                    </td>
                    <td className={`py-4 px-6 text-right font-semibold font-mono ${
                      tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(tx)}
                          className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(tx._id)}
                          className="p-1.5 hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Indicator */}
        {totalPages > 1 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-white/5">
            <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 border border-white/5 bg-slate-950/40 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 border border-white/5 bg-slate-950/40 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Overlay Modal (Add / Edit Form) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel border border-white/10 rounded-3xl p-6 relative flex flex-col gap-4 text-slate-200">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/5 transition text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-outfit font-bold text-xl text-white">
              {editingTx ? 'Edit Transaction' : 'Add Transaction'}
            </h3>

            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4 text-left">
              <div className="grid grid-cols-3 gap-2">
                {['expense', 'income', 'transfer'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: t })}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold uppercase text-center transition capitalize ${
                      formData.type === t
                        ? 'border-brand-500 bg-brand-500/10 text-white'
                        : 'border-white/5 bg-slate-950/40 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 font-semibold uppercase">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="py-2.5 px-3 bg-slate-950/60 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 font-semibold uppercase">Amount ({user?.currency || 'USD'})</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="py-2.5 px-3 bg-slate-950/60 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 font-semibold uppercase">Transaction Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="py-2.5 px-3 bg-slate-950/60 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 font-semibold uppercase">Description / Memo</label>
                <input
                  type="text"
                  placeholder="e.g. Weekly grocery stock"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="py-2.5 px-3 bg-slate-950/60 border border-white/5 rounded-xl text-sm text-white focus:outline-none"
                />
              </div>

              {/* Recurring payments checkbox */}
              <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2">
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-white">Recurring Payment</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Automated logging schedule</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                  className="w-4 h-4 rounded accent-brand-500"
                />
              </div>

              {formData.isRecurring && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-400 font-semibold uppercase">Frequency</label>
                  <select
                    value={formData.recurringFrequency}
                    onChange={(e) => setFormData({ ...formData, recurringFrequency: e.target.value })}
                    className="py-2 px-3 bg-slate-950/60 border border-white/5 rounded-xl text-xs text-white"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-4 mt-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-sm font-bold text-white rounded-xl shadow-glow transition duration-300 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingTx ? 'Save Changes' : 'Record Transaction'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Transactions;
