import React, { useState } from 'react';
import { ShieldCheck, Lock, ArrowLeft, KeyRound, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CannabisLeafIcon } from './CannabisLeafIcon';

interface AdminGateProps {
  onUnlock: () => void;
  onBackToStore: () => void;
}

const ADMIN_PRIMARY_EMAIL = 'joachimgrobbelaar@gmail.com';
const ADMIN_MASTER_PASSCODES = ['herbaladmin2026', 'grobbelaar2026', 'sis-operator-root'];

export const AdminGate: React.FC<AdminGateProps> = ({ onUnlock, onBackToStore }) => {
  const { user, isAdmin, signInGoogle } = useAuth();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleGoogleAdminLogin = async () => {
    setError(null);
    setIsAuthenticating(true);
    try {
      await signInGoogle();
      // If user logs in with the admin email or backend flags admin
      if (user?.email?.toLowerCase() === ADMIN_PRIMARY_EMAIL || isAdmin) {
        sessionStorage.setItem('hh_admin_verified', 'true');
        onUnlock();
      } else {
        // We will also check on state update, but show prompt if different account
        setTimeout(() => {
          if (user?.email?.toLowerCase() === ADMIN_PRIMARY_EMAIL || isAdmin) {
            sessionStorage.setItem('hh_admin_verified', 'true');
            onUnlock();
          }
        }, 800);
      }
    } catch (err: any) {
      setError(err?.message || 'Google sign-in could not be completed.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handlePasscodeUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = passcode.trim();
    if (ADMIN_MASTER_PASSCODES.includes(trimmed)) {
      sessionStorage.setItem('hh_admin_verified', 'true');
      sessionStorage.setItem('hh_admin_auth_method', 'passcode');
      onUnlock();
    } else {
      setError('Incorrect admin passcode. Access denied.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0d211a] text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-[#143329] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        
        {/* Top Icon & Badge */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 mb-4 shadow-[0_0_25px_rgba(37,168,106,0.3)]">
            <Lock className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-heading text-white tracking-tight">
            Admin Access Restricted
          </h2>
          <p className="text-xs text-emerald-200/80 mt-1.5 leading-relaxed">
            The Herbal Harbour Inventory &amp; Spreadsheet Management Suite is strictly protected. Only the store administrator can access these controls.
          </p>
        </div>

        {error && (
          <div className="mb-5 bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs p-3.5 rounded-2xl flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Method 1: Google Sign-in */}
        <div className="space-y-4">
          <button
            onClick={handleGoogleAdminLogin}
            disabled={isAuthenticating}
            className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2.5 transition-all shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.14z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{isAuthenticating ? 'Authenticating...' : 'Sign In with Admin Google Account'}</span>
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="h-px bg-emerald-500/20 flex-1" />
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">or enter master key</span>
            <div className="h-px bg-emerald-500/20 flex-1" />
          </div>

          {/* Method 2: Passcode Form */}
          <form onSubmit={handlePasscodeUnlock} className="space-y-3">
            <div className="relative">
              <KeyRound className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="Admin Passcode / Master Key"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-white placeholder-emerald-400/50 text-xs font-mono outline-none focus:border-emerald-400 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Unlock Admin Desk</span>
            </button>
          </form>
        </div>

        {/* Back to store */}
        <div className="mt-6 pt-5 border-t border-emerald-500/20 text-center">
          <button
            onClick={onBackToStore}
            className="text-xs text-emerald-300 hover:text-white transition-colors inline-flex items-center gap-1.5 font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Public Dispensary</span>
          </button>
        </div>
      </div>
    </div>
  );
};
