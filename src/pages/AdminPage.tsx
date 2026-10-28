import React, { useState, useEffect } from 'react';
import { Wallet, Search, ArrowLeft, Plus, Minus, Check, ShieldCheck, AlertCircle, RefreshCw, FileText, X } from 'lucide-react';
import { CannabisLeafIcon } from '../components/CannabisLeafIcon';

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  walletBalance: number;
  freeSpinsRemaining: number;
  ordersCount: number;
  totalSpent: number;
  lastActive: string;
}

interface AdminPageProps {
  onBackToStore: () => void;
  currentUserEmail: string;
}

const INITIAL_MOCK_USERS: AdminUserRecord[] = [
  {
    id: 'usr-1',
    name: 'Marnu Grobbelaar',
    email: 'joachimgrobbelaar@gmail.com',
    walletBalance: 250,
    freeSpinsRemaining: 3,
    ordersCount: 4,
    totalSpent: 1240,
    lastActive: 'Just now'
  },
  {
    id: 'usr-2',
    name: 'Johan van der Merwe',
    email: 'johan.vdm@capetown.co.za',
    walletBalance: 120,
    freeSpinsRemaining: 0,
    ordersCount: 8,
    totalSpent: 3450,
    lastActive: '2 hours ago'
  },
  {
    id: 'usr-3',
    name: 'Sipho Ndlovu',
    email: 'sipho.ndlovu@gmail.com',
    walletBalance: 50,
    freeSpinsRemaining: 1,
    ordersCount: 2,
    totalSpent: 680,
    lastActive: 'Yesterday'
  },
  {
    id: 'usr-4',
    name: 'Chloe Du Plessis',
    email: 'chloe.dp@sun.ac.za',
    walletBalance: 500,
    freeSpinsRemaining: 0,
    ordersCount: 12,
    totalSpent: 5900,
    lastActive: '3 days ago'
  }
];

export const AdminPage: React.FC<AdminPageProps> = ({ onBackToStore, currentUserEmail }) => {
  const [users, setUsers] = useState<AdminUserRecord[]>(() => {
    try {
      const saved = localStorage.getItem('hh_admin_users');
      return saved ? JSON.parse(saved) : INITIAL_MOCK_USERS;
    } catch {
      return INITIAL_MOCK_USERS;
    }
  });

  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);
  const [creditAmount, setCreditAmount] = useState('100');
  const [creditReason, setCreditReason] = useState('Manual EFT top-up');
  const [notification, setNotification] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('hh_admin_users', JSON.stringify(users));
    } catch (e) {
      console.error(e);
    }
  }, [users]);

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q);
  });

  const handleUpdateCredit = (isCredit: boolean) => {
    if (!selectedUser) return;
    const delta = parseFloat(creditAmount) || 0;
    if (delta <= 0) return;

    const change = isCredit ? delta : -delta;

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === selectedUser.id) {
          const newBal = Math.max(0, u.walletBalance + change);
          return { ...u, walletBalance: newBal };
        }
        return u;
      })
    );

    // If updating current active user, update local storage wallet
    if (selectedUser.email === currentUserEmail) {
      try {
        const stored = localStorage.getItem('herbal_harbour_user_profile');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.walletBalance = Math.max(0, parsed.walletBalance + change);
          localStorage.setItem('herbal_harbour_user_profile', JSON.stringify(parsed));
        }
      } catch (e) {
        console.error(e);
      }
    }

    setNotification(
      `Successfully ${isCredit ? 'credited' : 'debited'} R${delta.toFixed(2)} for ${selectedUser.name} (${creditReason})`
    );
    setSelectedUser(null);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#f7f8f7] text-slate-800">
      
      {/* Top Admin Navbar */}
      <header className="bg-[#122e24] text-white py-3.5 px-6 border-b border-emerald-950 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToStore}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Return to Store"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <CannabisLeafIcon className="w-6 h-6 text-[#25a86a]" />
            <h1 className="text-base font-bold font-heading">
              Herbal Harbour • Admin Control Desk
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="text-emerald-300 font-mono">
            Admin: <strong>{currentUserEmail}</strong>
          </span>
          <button
            onClick={onBackToStore}
            className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Back to Dispensary
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Notice Bar */}
        {notification && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-slide-up">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{notification}</span>
          </div>
        )}

        {/* Overview KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Registered Patients
            </span>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {users.length}
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Total Wallet Balances
            </span>
            <div className="text-2xl font-black text-emerald-700 font-mono">
              R {users.reduce((acc, u) => acc + u.walletBalance, 0).toFixed(2)}
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Casino Win Rate (House Edge)
            </span>
            <div className="text-2xl font-black text-amber-600 font-mono">
              18.0%
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Discreet Orders Dispatched
            </span>
            <div className="text-2xl font-black text-slate-900 font-mono">
              26
            </div>
          </div>
        </div>

        {/* User Search & Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-heading">
                Patient Wallets & Free Spin Management
              </h2>
              <p className="text-xs text-slate-500">
                Credit or debit balances after manual EFT confirmation or promotions.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs p-2.5 pl-8 rounded-xl border border-slate-200 outline-none focus:border-emerald-600"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
                <tr>
                  <th className="p-4">Patient</th>
                  <th className="p-4 text-right">Wallet Balance</th>
                  <th className="p-4 text-center">Free Spins Remaining</th>
                  <th className="p-4 text-right">Total Spent</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 text-sm">{u.name}</div>
                      <div className="text-slate-500 text-[11px] font-mono">{u.email}</div>
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-sm text-emerald-800">
                      R {u.walletBalance.toFixed(2)}
                    </td>
                    <td className="p-4 text-center font-mono">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-700">
                        {u.freeSpinsRemaining} / 3
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono text-slate-700">
                      R {u.totalSpent.toFixed(2)}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Wallet className="w-3 h-3" />
                        <span>Adjust Balance</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Credit / Debit Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200">
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 font-heading mb-1">
              Adjust Wallet Balance
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {selectedUser.name} ({selectedUser.email})<br />
              Current balance: <strong className="text-emerald-700 font-mono">R {selectedUser.walletBalance.toFixed(2)}</strong>
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Amount in ZAR (R)
                </label>
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono outline-none focus:border-emerald-600"
                  placeholder="100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Reason / Audit Log Note
                </label>
                <input
                  type="text"
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-emerald-600"
                  placeholder="e.g. Manual EFT confirmation #9812"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleUpdateCredit(false)}
                className="flex-1 py-2.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold flex items-center justify-center gap-1"
              >
                <Minus className="w-3.5 h-3.5" />
                <span>Debit</span>
              </button>
              <button
                type="button"
                onClick={() => handleUpdateCredit(true)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Credit R{creditAmount}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
