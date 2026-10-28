import React, { useState } from 'react';
import { X, Sparkles, Wallet, Gift, ArrowRight, MessageCircle } from 'lucide-react';
import { UserProfile } from './WalletModal';

interface JackpotSpinModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateWallet: (newBalance: number) => void;
  onOpenWallet: () => void;
}

const SYMBOLS = ['🍒', '🍏', '🍊', '🔔', '⭐'] as const;

// Prize table — payout in ZAR wallet credit (from user specification)
const PRIZES: Record<string, number> = {
  '🍒': 20,
  '🍏': 30,
  '🍊': 50,
  '🔔': 100,
  '⭐': 500,
};

const PAID_SPIN_COST = 10;
const WIN_CHANCE = 0.18; // ~18% overall win chance (unfair house edge)

export const JackpotSpinModal: React.FC<JackpotSpinModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateWallet,
  onOpenWallet
}) => {
  const [reels, setReels] = useState<string[]>(['🍒', '🍏', '⭐']);
  const [isSpinning, setIsSpinning] = useState(false);
  const [freeSpinsRemaining, setFreeSpinsRemaining] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('hh_free_spins');
      return saved !== null ? parseInt(saved, 10) : 3;
    } catch {
      return 3;
    }
  });
  const [message, setMessage] = useState('Spin for a chance to win real dispensary wallet credit!');
  const [lastPayout, setLastPayout] = useState<number | null>(null);

  if (!isOpen) return null;

  const isFree = freeSpinsRemaining > 0;
  const canAfford = isFree || user.walletBalance >= PAID_SPIN_COST;

  const rollSymbols = (): { symbols: string[]; payout: number } => {
    const willWin = Math.random() < WIN_CHANCE;

    if (!willWin) {
      // Near-miss tease: two matching symbols + one different
      const teaser = Math.random() < 0.4 ? '⭐' : SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      const miss = SYMBOLS.filter((s) => s !== teaser)[Math.floor(Math.random() * 4)];
      return { symbols: [teaser, teaser, miss], payout: 0 };
    }

    // Weighted win: cherry most likely, star is < 1%
    const r = Math.random();
    let chosen: string;
    if (r < 0.55) chosen = '🍒';      // 55% of wins (~10% overall) -> R20
    else if (r < 0.80) chosen = '🍏'; // 25% of wins (~4.5% overall) -> R30
    else if (r < 0.93) chosen = '🍊'; // 13% of wins (~2.3% overall) -> R50
    else if (r < 0.99) chosen = '🔔'; // 6% of wins (~1% overall) -> R100
    else chosen = '⭐';               // 1% of wins (~0.18% overall) -> R500 Jackpot!

    return { symbols: [chosen, chosen, chosen], payout: PRIZES[chosen] };
  };

  const handleSpin = async () => {
    if (isSpinning || !canAfford) return;

    setIsSpinning(true);
    setLastPayout(null);
    setMessage(isFree ? '🎰 Spinning free turn…' : `🎰 Spinning — R${PAID_SPIN_COST}…`);

    // Debit cost if paid spin
    let currentBalance = user.walletBalance;
    if (isFree) {
      const newFree = freeSpinsRemaining - 1;
      setFreeSpinsRemaining(newFree);
      localStorage.setItem('hh_free_spins', newFree.toString());
    } else {
      currentBalance = Math.max(0, currentBalance - PAID_SPIN_COST);
      onUpdateWallet(currentBalance);
    }

    // Ticker animation
    for (let i = 0; i < 14; i++) {
      await new Promise((resolve) => setTimeout(resolve, 70));
      setReels([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      ]);
    }

    // Final result based on server-like weighted RNG
    const result = rollSymbols();
    setReels(result.symbols);
    setIsSpinning(false);

    if (result.payout > 0) {
      setLastPayout(result.payout);
      const updatedBalance = currentBalance + result.payout;
      onUpdateWallet(updatedBalance);
      setMessage(`🎉 WINNER! 3x ${result.symbols[0]} matched! R${result.payout} credited directly to your wallet.`);
    } else {
      setMessage(`😭 Missed it by one! [${result.symbols[0]} | ${result.symbols[1]} | ${result.symbols[2]}]. Try again!`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#18392e] to-[#0e241d] text-white rounded-3xl p-6 sm:p-7 border border-emerald-600/30 shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            HARBOUR CASINO LUCKY REEL
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-heading">
            Spin & Win Store Credit
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Wins are credited directly into your Herbal Harbour Patient Wallet.
          </p>
        </div>

        {/* Wallet + Free Spin Bar */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-black/40 rounded-xl p-3 border border-amber-500/20 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-amber-300">
                <Wallet className="w-3 h-3" /> Wallet
              </div>
              <div className="text-base sm:text-lg font-mono font-black text-white">
                R {user.walletBalance.toFixed(2)}
              </div>
            </div>
            <button
              onClick={() => { onClose(); onOpenWallet(); }}
              className="text-[10px] bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 px-2 py-1 rounded-lg font-bold"
            >
              Top Up
            </button>
          </div>

          <div className="bg-black/40 rounded-xl p-3 border border-emerald-500/20">
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-emerald-300">
              <Gift className="w-3 h-3" /> Free Spins
            </div>
            <div className="text-base sm:text-lg font-mono font-black text-white">
              {freeSpinsRemaining} <span className="text-xs font-normal text-slate-400">/ 3</span>
            </div>
          </div>
        </div>

        {/* Prize Table */}
        <div className="bg-black/25 rounded-xl p-2.5 mb-4 text-[11px] text-emerald-200 flex flex-wrap items-center justify-around gap-2 text-center border border-white/5 font-mono">
          <span>🍒 R20 (2x)</span>
          <span>•</span>
          <span>🍏 R30 (3x)</span>
          <span>•</span>
          <span>🍊 R50 (5x)</span>
          <span>•</span>
          <span>🔔 R100 (10x)</span>
          <span>•</span>
          <span className="text-amber-300 font-bold">⭐ R500 JACKPOT (50x)</span>
        </div>

        {/* Reels Cabinet */}
        <div className="grid grid-cols-3 gap-3 bg-[#0a1411] p-3 sm:p-4 rounded-2xl border border-emerald-950 mb-4 shadow-inner">
          {reels.map((s, i) => (
            <div
              key={i}
              className={`h-24 sm:h-28 rounded-xl bg-gradient-to-b from-[#fbf8ee] to-[#ecdcb9] flex items-center justify-center text-4xl sm:text-5xl shadow-md border-b-4 border-amber-700/60 transition-transform ${
                isSpinning ? 'animate-bounce' : ''
              }`}
            >
              {s}
            </div>
          ))}
        </div>

        {/* Status Message */}
        <div className="text-center text-xs sm:text-sm font-medium text-amber-200 bg-black/40 rounded-xl p-3 mb-4 min-h-[44px] flex items-center justify-center border border-white/5">
          {message}
        </div>

        {/* Payout callout if won */}
        {lastPayout !== null && lastPayout > 0 && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-400 rounded-xl text-center text-xs font-bold text-emerald-300 mb-4">
            🎉 R {lastPayout.toFixed(2)} added to your wallet! Use at checkout on any order.
          </div>
        )}

        {/* Spin Button */}
        <button
          onClick={handleSpin}
          disabled={isSpinning || !canAfford}
          className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 ${
            !canAfford
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : isSpinning
              ? 'bg-slate-700 text-slate-300'
              : isFree
              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer active:scale-98'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer active:scale-98'
          }`}
        >
          {isSpinning
            ? 'Spinning…'
            : !canAfford
            ? 'Insufficient Balance (R10 required)'
            : isFree
            ? `Spin Free (${freeSpinsRemaining} left)`
            : `Spin For R${PAID_SPIN_COST}`}
        </button>

        {/* Top-up Link if out of balance */}
        {!canAfford && (
          <div className="mt-3 flex items-center justify-center gap-4 text-xs">
            <button
              onClick={() => { onClose(); onOpenWallet(); }}
              className="text-amber-300 hover:text-amber-200 font-bold underline cursor-pointer"
            >
              Top Up Wallet with Google Pay →
            </button>
            <span className="text-slate-500">•</span>
            <a
              href={`https://wa.me/27824489120?text=${encodeURIComponent(
                'Hi Herbal Harbour, I would like to top up my wallet.'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#25D366] hover:underline font-bold inline-flex items-center gap-1"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp EFT Top-Up</span>
            </a>
          </div>
        )}

        <div className="text-[10px] text-center text-slate-400 mt-4">
          House edge active (~18% win probability) • Valid for store credit only
        </div>

      </div>
    </div>
  );
};
