import React, { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { CannabisLeafIcon } from './CannabisLeafIcon';

export const AgeVerificationModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const verified = localStorage.getItem('herbal_harbour_age_verified');
    if (!verified) {
      setIsOpen(true);
    }
  }, []);

  const handleConfirm = () => {
    localStorage.setItem('herbal_harbour_age_verified', 'true');
    setIsOpen(false);
  };

  const handleDecline = () => {
    window.location.href = 'https://www.google.co.za';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 text-center shadow-2xl border border-slate-200">
        
        {/* Authentic Cannabis Leaf Emblem */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1b3d32] to-[#122b23] text-[#25a86a] flex items-center justify-center mx-auto mb-4 shadow-md">
          <CannabisLeafIcon className="w-10 h-10 text-[#25a86a]" />
        </div>

        <span className="text-[11px] font-bold tracking-widest uppercase text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Age Verification • South Africa
        </span>

        <h2 className="text-2xl font-extrabold text-slate-900 mt-3 mb-2 font-heading">
          Welcome to Herbal Harbour
        </h2>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
          You must be <strong>18 years or older</strong> to access medical cannabis seeds, full-spectrum extracts, and therapeutic botanical products in compliance with South African regulatory guidelines.
        </p>

        <div className="space-y-3">
          <button
            onClick={handleConfirm}
            className="w-full py-3.5 px-6 rounded-full bg-[#1e8755] hover:bg-[#166c43] active:scale-98 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-200" />
            <span>I Am 18 Years Or Older — Enter</span>
          </button>

          <button
            onClick={handleDecline}
            className="w-full py-2.5 px-6 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-600 font-semibold text-xs transition-colors cursor-pointer"
          >
            I Am Under 18 — Exit
          </button>
        </div>

        <p className="text-[10px] text-slate-400 mt-4 leading-tight">
          By entering, you confirm you are of legal adult age in the Republic of South Africa and agree to our terms of service.
        </p>
      </div>
    </div>
  );
};
