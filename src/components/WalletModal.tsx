import React, { useState } from 'react';
import { X, Wallet, ArrowUpRight, Check, ShieldCheck, CreditCard, Lock, Sparkles, LogIn, LogOut } from 'lucide-react';

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  walletBalance: number;
  isSignedIn: boolean;
}

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onGoogleSignIn: () => void;
  onSignOut: () => void;
  onTopUpWallet: (amount: number) => void;
}

const PRESET_AMOUNTS = [100, 250, 500, 1000];

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  user,
  onGoogleSignIn,
  onSignOut,
  onTopUpWallet
}) => {
  const [selectedAmount, setSelectedAmount] = useState<number>(250);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isProcessingGPay, setIsProcessingGPay] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  if (!isOpen) return null;

  const topUpAmount = customAmount ? parseFloat(customAmount) || 0 : selectedAmount;

  const handleGooglePayTopUp = () => {
    if (topUpAmount <= 0) return;

    setIsProcessingGPay(true);
    setTimeout(() => {
      onTopUpWallet(topUpAmount);
      setIsProcessingGPay(false);
      setSuccessToast(true);
      setTimeout(() => {
        setSuccessToast(false);
        onClose();
      }, 1500);
    }, 1100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header */}
        <div className="bg-[#143329] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold font-heading">
              Herbal Harbour Patient Wallet
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          
          {/* User Account / Google Login status */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            {user.isSignedIn ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-10 h-10 rounded-full border-2 border-emerald-600 object-cover"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">{user.name}</h4>
                    <span className="text-[11px] text-slate-500 block truncate">{user.email}</span>
                  </div>
                </div>
                <button
                  onClick={onSignOut}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors text-xs font-medium"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-xs text-slate-600 mb-3">
                  Sign in with your Google Account to synchronize your patient wallet and prescription history.
                </p>
                {/* Official Google Sign In Button */}
                <button
                  onClick={onGoogleSignIn}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs flex items-center justify-center gap-2.5 text-xs font-bold text-slate-700 transition-all cursor-pointer active:scale-98"
                >
                  {/* Google Multicolor 'G' Icon */}
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </button>
              </div>
            )}
          </div>

          {/* Current Wallet Balance Card */}
          <div className="bg-gradient-to-br from-[#143329] to-[#0c1f19] text-white p-5 rounded-2xl shadow-md relative overflow-hidden">
            <div className="relative z-10">
              <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block mb-1">
                Available Wallet Balance
              </span>
              <div className="text-3xl font-black font-mono tracking-tight text-white tabular-nums">
                R {user.walletBalance.toFixed(2)}
              </div>
              <span className="text-[10px] text-slate-300 mt-1 block">
                Instant checkout deduction on any South African order
              </span>
            </div>
          </div>

          {/* Top-up Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Top-Up Amount (ZAR R)
            </label>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => { setSelectedAmount(amt); setCustomAmount(''); }}
                  className={`py-2 text-center rounded-xl font-mono text-xs font-bold border transition-all cursor-pointer ${
                    selectedAmount === amt && !customAmount
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  R {amt}
                </button>
              ))}
            </div>

            <input
              type="number"
              placeholder="Or enter custom amount in R..."
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              min={10}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono outline-none focus:border-emerald-600"
            />
          </div>

          {/* Google Pay Official Button */}
          <div>
            <button
              onClick={handleGooglePayTopUp}
              disabled={isProcessingGPay || topUpAmount <= 0}
              className="w-full py-3.5 px-6 rounded-2xl bg-black hover:bg-slate-900 active:scale-98 text-white font-bold text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessingGPay ? (
                <span>Processing Google Pay...</span>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Pay with</span>
                  {/* Google Pay Logo */}
                  <div className="flex items-center bg-white px-2 py-0.5 rounded text-black text-xs font-black tracking-tight">
                    <span className="text-[#4285F4]">G</span>
                    <span className="text-[#EA4335]">o</span>
                    <span className="text-[#FBBC05]">o</span>
                    <span className="text-[#4285F4]">g</span>
                    <span className="text-[#34A853]">l</span>
                    <span className="text-[#EA4335]">e</span>
                    <span className="ml-1 text-slate-800">Pay</span>
                  </div>
                  <span className="ml-1 font-mono tabular-nums">• R {topUpAmount.toFixed(2)}</span>
                </div>
              )}
            </button>
            <p className="text-[10px] text-center text-slate-400 mt-2 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Secured by Google Pay tokenization & biometric authentication
            </p>
          </div>

          {/* Success Notification */}
          {successToast && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-bounce">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Wallet successfully topped up by R {topUpAmount.toFixed(2)}!</span>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
