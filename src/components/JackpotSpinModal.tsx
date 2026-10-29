import React, { useState } from 'react';
import { X, Sparkles, Wallet, Gift, ArrowRight, LogIn, Lock, Heart, Award } from 'lucide-react';
import { UserProfile } from './WalletModal';
import { AnimatedSlotMachine } from './AnimatedSlotMachine';
import { triggerConfetti } from '../utils/confetti';
import { sound } from '../utils/audio';

interface JackpotSpinModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateWallet: (newBalance: number) => void;
  onOpenWallet: () => void;
  onCharityContribution?: (amountZAR: number) => void;
}

const SYMBOLS = ['🍒', '🍏', '🍊', '🔔', '⭐'] as const;

// Prize table — payout in ZAR wallet credit
const PRIZES: Record<string, number> = {
  '🍒': 25,
  '🍏': 40,
  '🍊': 65,
  '🔔': 150,
  '⭐': 500, // Mega Jackpot
};

const PAID_SPIN_COST = 10;
const WIN_CHANCE = 0.22; // ~22% generous dispensary win rate
const CHARITY_PORTION_PER_SPIN = 2.0; // R2 per paid spin goes directly to Community Charity Fund

export const JackpotSpinModal: React.FC<JackpotSpinModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateWallet,
  onOpenWallet,
  onCharityContribution
}) => {
  const [reels, setReels] = useState<[string, string, string]>(['🍒', '🍏', '⭐']);
  const [isSpinning, setIsSpinning] = useState(false);
  const [freeSpinsRemaining, setFreeSpinsRemaining] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('hh_free_spins');
      return saved !== null ? parseInt(saved, 10) : 3;
    } catch {
      return 3;
    }
  });

  const [message, setMessage] = useState('Pull the 3D lever or press Spin to play!');
  const [lastPayout, setLastPayout] = useState<number | null>(null);
  const [targetOutcome, setTargetOutcome] = useState<{ symbols: [string, string, string]; payout: number }>({
    symbols: ['🍒', '🍏', '⭐'],
    payout: 0
  });

  if (!isOpen) return null;

  const isFree = freeSpinsRemaining > 0;
  const canAfford = user.isSignedIn && (isFree || user.walletBalance >= PAID_SPIN_COST);

  const rollSymbols = (): { symbols: [string, string, string]; payout: number } => {
    const willWin = Math.random() < WIN_CHANCE;

    if (!willWin) {
      // Near-miss tease: two matching symbols + one adjacent
      const teaser = Math.random() < 0.45 ? '⭐' : SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      const miss = SYMBOLS.filter((s) => s !== teaser)[Math.floor(Math.random() * 4)];
      return { symbols: [teaser, teaser, miss], payout: 0 };
    }

    // Weighted payout
    const r = Math.random();
    let chosen: string;
    if (r < 0.50) chosen = '🍒';      // R25
    else if (r < 0.75) chosen = '🍏'; // R40
    else if (r < 0.90) chosen = '🍊'; // R65
    else if (r < 0.98) chosen = '🔔'; // R150
    else chosen = '⭐';               // R500 Jackpot!

    return { symbols: [chosen, chosen, chosen], payout: PRIZES[chosen] };
  };

  const handleStartSpin = () => {
    if (!user.isSignedIn) {
      setMessage('🔒 You must be signed in to spin the slot machine.');
      return;
    }
    if (isSpinning || !canAfford) return;

    // Calculate outcome ahead for staggered 3D animation
    const outcome = rollSymbols();
    setTargetOutcome(outcome);
    setIsSpinning(true);
    setLastPayout(null);
    setMessage(isFree ? '🎰 Spinning 3D Mechanical Reels — Free Turn…' : `🎰 Spinning — R${PAID_SPIN_COST}…`);

    // Debit cost if paid spin & credit charity
    if (isFree) {
      const newFree = freeSpinsRemaining - 1;
      setFreeSpinsRemaining(newFree);
      try {
        localStorage.setItem('hh_free_spins', newFree.toString());
      } catch (e) {
        console.error(e);
      }
    } else {
      const newBal = Math.max(0, user.walletBalance - PAID_SPIN_COST);
      onUpdateWallet(newBal);

      // Automated charity contribution from every paid spin
      if (onCharityContribution) {
        onCharityContribution(CHARITY_PORTION_PER_SPIN);
      }
    }
  };

  const handleSpinFinished = (symbols: [string, string, string], payout: number) => {
    setReels(symbols);
    setIsSpinning(false);

    if (payout > 0) {
      setLastPayout(payout);
      const updatedBalance = user.walletBalance + payout;
      onUpdateWallet(updatedBalance);
      triggerConfetti();
      sound.playWin();
      setMessage(`🎉 JACKPOT WINNER! 3x ${symbols[0]} matched! R${payout} credited directly to your wallet.`);
    } else {
      sound.playTryAgain();
      setMessage(`⚡ Almost had it! [${symbols[0]} | ${symbols[1]} | ${symbols[2]}]. Pull again!`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      {/* Amsterdam Red Light District Inspired Glow Box */}
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#1c0818] via-[#10221a] to-[#081510] text-white rounded-3xl p-5 sm:p-7 border-2 border-pink-500/40 shadow-[0_0_50px_rgba(255,0,85,0.3)]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors z-20 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Amsterdam Red Light District Header */}
        <div className="text-center mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-400/50 text-pink-300 text-xs font-black tracking-wider uppercase mb-1.5 shadow-[0_0_12px_rgba(255,0,85,0.4)]">
            <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping" />
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            AMSTERDAM COFFEESHOP 3D SLOTS
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-heading text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-amber-200 to-emerald-300">
            Spin & Win Store Credit
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5">
            Real mechanical 3D lever & reels. Wins are credited instantly to your patient wallet!
          </p>
        </div>

        {/* Interactive 3D Animated Slot Machine Viewport */}
        <div className="w-full h-60 sm:h-64 rounded-2xl bg-black/60 border border-pink-500/30 mb-3 overflow-hidden relative shadow-inner">
          <AnimatedSlotMachine
            isSpinning={isSpinning}
            onLeverPull={handleStartSpin}
            onSpinFinished={handleSpinFinished}
            targetSymbols={targetOutcome.symbols}
            targetPayout={targetOutcome.payout}
          />
        </div>

        {/* Synchronized Symbol Ticker & Status Marquee */}
        <div className="mb-3 p-3 rounded-2xl bg-black/50 border border-emerald-500/30 text-center">
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-1.5">
            {reels.map((s, i) => (
              <div
                key={i}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 ${
                  lastPayout ? 'border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'border-slate-700'
                } flex items-center justify-center text-2xl sm:text-3xl ${isSpinning ? 'animate-bounce' : ''}`}
              >
                {s}
              </div>
            ))}
          </div>

          <p className={`text-xs font-bold ${lastPayout ? 'text-amber-300 animate-pulse' : 'text-slate-200'}`}>
            {message}
          </p>
        </div>

        {/* Automatic Charity Contribution Bar */}
        <div className="mb-3 px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-emerald-300 font-semibold text-[11px]">
            <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400" />
            <span>R{CHARITY_PORTION_PER_SPIN.toFixed(2)} from every paid spin automatically aids SA medical relief</span>
          </span>
          <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-700">
            Automated Impact
          </span>
        </div>

        {/* Authentication Warning if Guest */}
        {!user.isSignedIn && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-400/40 text-center mb-3">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-300 mb-1">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Sign In Required to Spin</span>
            </div>
            <button
              onClick={() => { onClose(); onOpenWallet(); }}
              className="py-1.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-950" />
              <span>Log In to Claim 3 Free Spins</span>
            </button>
          </div>
        )}

        {/* Wallet & Spins Control Bar */}
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          <div className="bg-black/50 rounded-xl p-2.5 border border-amber-500/20 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold text-amber-300 flex items-center gap-1">
                <Wallet className="w-3 h-3" /> Wallet
              </div>
              <div className="text-base font-mono font-black text-white">
                R {user.walletBalance.toFixed(2)}
              </div>
            </div>
            <button
              onClick={() => { onClose(); onOpenWallet(); }}
              className="text-[10px] bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 px-2 py-1 rounded-lg font-bold cursor-pointer"
            >
              Top Up
            </button>
          </div>

          <div className="bg-black/50 rounded-xl p-2.5 border border-pink-500/20 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold text-pink-300 flex items-center gap-1">
                <Gift className="w-3 h-3" /> Free Turns
              </div>
              <div className="text-base font-mono font-black text-white">
                {freeSpinsRemaining} <span className="text-[10px] text-slate-400 font-normal">turns</span>
              </div>
            </div>
            <span className="text-[10px] text-pink-300 bg-pink-500/20 px-2 py-1 rounded-lg font-bold">
              {isFree ? 'FREE' : `R${PAID_SPIN_COST}`}
            </span>
          </div>
        </div>

        {/* Spin Action Button */}
        <button
          onClick={handleStartSpin}
          disabled={isSpinning || !canAfford}
          className={`w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer ${
            isSpinning
              ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
              : canAfford
              ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 hover:from-pink-400 hover:to-amber-300 text-white shadow-[0_0_25px_rgba(255,0,85,0.4)] hover:scale-[1.02] active:scale-95'
              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
          }`}
        >
          {isSpinning ? (
            <>
              <span className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
              <span>Reels Spinning...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>
                {isFree ? 'Pull 3D Lever (FREE TURN)' : `Pull 3D Lever (Play R${PAID_SPIN_COST})`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Payout Legend */}
        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>🍒 3x = R25</span>
          <span>🍏 3x = R40</span>
          <span>🍊 3x = R65</span>
          <span>🔔 3x = R150</span>
          <span className="text-amber-300 font-bold">⭐ 3x = R500</span>
        </div>

      </div>
    </div>
  );
};
