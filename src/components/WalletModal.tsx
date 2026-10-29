import React, { useState } from 'react';
import { X, Wallet, ShieldCheck, Check, ArrowRight, UserRound, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';
import { requestGooglePayTopUp } from '../lib/googlePay';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  walletBalance: number;
  onTopUp: (amount: number) => void;
  onOpenAuth: () => void;
}

const PRESET_AMOUNTS = [100, 250, 500, 1000];

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  user,
  walletBalance,
  onTopUp,
  onOpenAuth,
}) => {
  const [selectedAmount, setSelectedAmount] = useState<number>(250);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const finalAmount = customAmount ? parseFloat(customAmount) || 0 : selectedAmount;

  const handlePay = async () => {
    if (!user.isSignedIn) {
      onClose();
      onOpenAuth();
      return;
    }
    if (finalAmount <= 0) {
      setErrorMsg('Enter a valid amount (minimum R10).');
      return;
    }
    setErrorMsg(null);
    setIsProcessing(true);
    try {
      await requestGooglePayTopUp(finalAmount);
      onTopUp(finalAmount);
      setSuccessToast(true);
      setTimeout(() => {
        setSuccessToast(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment could not be completed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-900/75 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-forest-900/10 overflow-hidden my-6">
        
        {/* Header */}
        <div className="bg-[#143329] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-signal" />
            <h3 className="text-base font-extrabold font-heading">
              Herbal Harbour Patient Wallet
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* User Sign-In Status */}
          <div className="p-4 rounded-2xl bg-paper border border-forest-900/10">
            {user.isSignedIn ? (
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full border-2 border-forest-900/15 grid place-items-center overflow-hidden shrink-0 bg-white">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <UserRound className="w-5 h-5 text-forest-900" />
                  )}
                </span>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{user.name}</h4>
                  <span className="text-[11px] text-slate-500 block truncate">{user.email}</span>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-xs text-slate-600 mb-3">
                  Sign in to link your store credit wallet, prescription history, and Spin & Win earnings.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="w-full py-2.5 px-4 bg-forest-900 text-signal hover:bg-forest-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <span>Sign In or Register</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Current Balance Card */}
          <div className="bg-gradient-to-br from-[#143329] to-[#0c1f19] text-white p-5 rounded-2xl shadow-md relative overflow-hidden">
            <span className="text-[11px] font-bold text-signal uppercase tracking-wider block mb-1">
              Available Store Credit & Wallet
            </span>
            <div className="text-3xl font-black font-mono tracking-tight text-white tabular-nums">
              R {walletBalance.toFixed(2)}
            </div>
            <span className="text-[11px] text-emerald-100/70 mt-1 block">
              Deducts automatically from your order checkout or EFT balance.
            </span>
          </div>

          {/* Top-up Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Top-Up Amount (ZAR)
            </label>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setSelectedAmount(amt);
                    setCustomAmount('');
                  }}
                  className={`py-2 text-center rounded-xl font-mono text-xs font-bold border transition-all cursor-pointer ${
                    selectedAmount === amt && !customAmount
                      ? 'bg-forest-900 text-signal border-forest-900 shadow-xs'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  R {amt}
                </button>
              ))}
            </div>

            <input
              type="number"
              placeholder="Or enter custom amount in Rand (R)..."
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              min={10}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono outline-none focus:border-forest-900"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">{errorMsg}</p>
          )}

          {/* Google Pay Button */}
          <div>
            <button
              type="button"
              onClick={handlePay}
              disabled={isProcessing}
              className="w-full py-3.5 px-6 rounded-2xl bg-black hover:bg-slate-900 active:scale-98 text-white font-bold text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <span>Processing Google Pay…</span>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Pay with</span>
                  <div className="flex items-center bg-white px-2 py-0.5 rounded text-black text-xs font-black tracking-tight">
                    <span className="text-[#4285F4]">G</span>
                    <span className="text-[#EA4335]">o</span>
                    <span className="text-[#FBBC05]">o</span>
                    <span className="text-[#4285F4]">g</span>
                    <span className="text-[#34A853]">l</span>
                    <span className="text-[#EA4335]">e</span>
                    <span className="ml-1 text-slate-800 font-bold">Pay</span>
                  </div>
                  <span className="ml-1 font-mono tabular-nums">• R {finalAmount.toFixed(2)}</span>
                </div>
              )}
            </button>
            <p className="text-[10px] text-center text-slate-400 mt-2 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-forest-700" />
              Secured by Google Pay tokenization & encrypted checkout
            </p>
          </div>

          {successToast && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-bounce">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Wallet successfully topped up by R {finalAmount.toFixed(2)}!</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
