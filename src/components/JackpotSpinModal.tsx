import React, { useState, useEffect } from 'react';
import { X, Sparkles, Wallet, Gift, ArrowRight, LogIn, Lock, Heart, Award, History, Layers } from 'lucide-react';
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

export interface SlotSymbol {
  icon: string;
  name: string;
  color: string;
  basePayout: number;
  multiplierText: string;
}

export const SLOT_SYMBOLS: Record<string, SlotSymbol> = {
  '🌿': { icon: '🌿', name: 'Craft Bud', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40', basePayout: 25, multiplierText: '2.5x' },
  '🍯': { icon: '🍯', name: 'Karoo Honey', color: 'text-amber-300 bg-amber-950/60 border-amber-500/40', basePayout: 40, multiplierText: '4.0x' },
  '🍄': { icon: '🍄', name: 'Sacred Shroom', color: 'text-purple-300 bg-purple-950/60 border-purple-500/40', basePayout: 65, multiplierText: '6.5x' },
  '💎': { icon: '💎', name: 'Diamond Rosin', color: 'text-cyan-300 bg-cyan-950/60 border-cyan-500/40', basePayout: 100, multiplierText: '10x' },
  '🔔': { icon: '🔔', name: 'Gold Bell', color: 'text-yellow-300 bg-yellow-950/60 border-yellow-500/40', basePayout: 150, multiplierText: '15x' },
  '⭐': { icon: '⭐', name: '777 Jackpot', color: 'text-rose-300 bg-rose-950/60 border-rose-500/50', basePayout: 500, multiplierText: '50x' }
};

const SYMBOL_KEYS = Object.keys(SLOT_SYMBOLS);

interface SpinOutcomeRecord {
  id: string;
  symbols: [string, string, string];
  payout: number;
  wager: number;
  time: string;
  isWin: boolean;
}

export const JackpotSpinModal: React.FC<JackpotSpinModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateWallet,
  onOpenWallet,
  onCharityContribution
}) => {
  const [reels, setReels] = useState<[string, string, string]>(['🌿', '🍯', '⭐']);
  const [isSpinning, setIsSpinning] = useState(false);
  const [betTier, setBetTier] = useState<10 | 25>(10);
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
    symbols: ['🌿', '🍯', '⭐'],
    payout: 0
  });

  // Visual History of recent spin outcomes
  const [recentOutcomes, setRecentOutcomes] = useState<SpinOutcomeRecord[]>(() => {
    try {
      const saved = localStorage.getItem('hh_recent_spins');
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return [
      { id: '1', symbols: ['🌿', '🌿', '🌿'], payout: 25, wager: 10, time: 'Just now', isWin: true },
      { id: '2', symbols: ['🍄', '🍄', '🌿'], payout: 0, wager: 10, time: '2m ago', isWin: false },
      { id: '3', symbols: ['⭐', '⭐', '⭐'], payout: 500, wager: 0, time: '10m ago', isWin: true }
    ];
  });

  if (!isOpen) return null;

  const isFree = freeSpinsRemaining > 0;
  const currentCost = isFree ? 0 : betTier;
  const canAfford = user.isSignedIn && (isFree || user.walletBalance >= currentCost);
  const multiplier = betTier === 25 ? 2.5 : 1.0;

  const rollSymbols = (): { symbols: [string, string, string]; payout: number } => {
    const willWin = Math.random() < 0.24; // 24% win chance

    if (!willWin) {
      // Near miss teaser (2 matching, 1 different)
      const teaser = Math.random() < 0.45 ? '⭐' : SYMBOL_KEYS[Math.floor(Math.random() * SYMBOL_KEYS.length)];
      const miss = SYMBOL_KEYS.filter((s) => s !== teaser)[Math.floor(Math.random() * (SYMBOL_KEYS.length - 1))];
      return { symbols: [teaser, teaser, miss], payout: 0 };
    }

    // Weighted payout selection
    const r = Math.random();
    let chosen: string;
    if (r < 0.45) chosen = '🌿';      // R25 base
    else if (r < 0.70) chosen = '🍯'; // R40 base
    else if (r < 0.85) chosen = '🍄'; // R65 base
    else if (r < 0.94) chosen = '💎'; // R100 base
    else if (r < 0.98) chosen = '🔔'; // R150 base
    else chosen = '⭐';               // R500 base

    const basePrize = SLOT_SYMBOLS[chosen]?.basePayout || 25;
    const finalPayout = Math.round(basePrize * (isFree ? 1.0 : multiplier));

    return { symbols: [chosen, chosen, chosen], payout: finalPayout };
  };

  const handleStartSpin = () => {
    if (!user.isSignedIn) {
      setMessage('🔒 You must be signed in to spin the slot machine.');
      return;
    }
    if (isSpinning || !canAfford) return;

    const outcome = rollSymbols();
    setTargetOutcome(outcome);
    setIsSpinning(true);
    setLastPayout(null);
    setMessage(isFree ? '🎰 Spinning 3D Mechanical Reels — Free Turn…' : `🎰 Spinning — R${currentCost} Wager (${multiplier}x Payout)…`);

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
      const newBal = Math.max(0, user.walletBalance - currentCost);
      onUpdateWallet(newBal);

      // Automated charity contribution from every paid spin (20% of spin price)
      if (onCharityContribution) {
        onCharityContribution(currentCost * 0.2);
      }
    }
  };

  const handleSpinFinished = (symbols: [string, string, string], payout: number) => {
    setReels(symbols);
    setIsSpinning(false);

    const isWin = payout > 0;
    if (isWin) {
      setLastPayout(payout);
      const updatedBalance = user.walletBalance + payout;
      onUpdateWallet(updatedBalance);
      triggerConfetti();
      sound.playWin();
      setMessage(`🎉 JACKPOT WINNER! 3x ${SLOT_SYMBOLS[symbols[0]]?.name || symbols[0]} matched! R${payout} credited directly to your wallet.`);
    } else {
      sound.playTryAgain();
      setMessage(`⚡ Almost had it! [${symbols[0]} | ${symbols[1]} | ${symbols[2]}]. Pull 3D lever again!`);
    }

    // Add to recent outcomes ledger
    const newRecord: SpinOutcomeRecord = {
      id: Date.now().toString(),
      symbols,
      payout,
      wager: currentCost,
      time: 'Just now',
      isWin
    };
    setRecentOutcomes((prev) => {
      const updated = [newRecord, ...prev.slice(0, 4)];
      try {
        localStorage.setItem('hh_recent_spins', JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      {/* Amsterdam Red Light District Inspired Glow Cabinet */}
      <div className="relative w-full max-w-xl bg-gradient-to-b from-[#1f091c] via-[#10221a] to-[#081510] text-white rounded-3xl p-5 sm:p-6 border-2 border-pink-500/40 shadow-[0_0_60px_rgba(255,0,85,0.35)] my-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors z-20 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Amsterdam Red Light District Header */}
        <div className="text-center mb-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-400/50 text-pink-300 text-xs font-black tracking-wider uppercase mb-1 shadow-[0_0_15px_rgba(255,0,85,0.4)]">
            <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping" />
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            AMSTERDAM COFFEESHOP 3D SLOTS
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-heading text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-amber-200 to-emerald-300">
            Spin & Win Store Credit
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-300">
            Mechanical 3D ease-out reels. Wins credited instantly to your patient wallet!
          </p>
        </div>

        {/* Interactive 3D Animated Slot Machine Viewport */}
        <div className="w-full h-56 sm:h-60 rounded-2xl bg-black/70 border border-pink-500/30 mb-2.5 overflow-hidden relative shadow-inner">
          <AnimatedSlotMachine
            isSpinning={isSpinning}
            onLeverPull={handleStartSpin}
            onSpinFinished={handleSpinFinished}
            targetSymbols={targetOutcome.symbols}
            targetPayout={targetOutcome.payout}
          />
        </div>

        {/* Visual Reels Outcome Marquee & Payline Indicator */}
        <div className="mb-2.5 p-3 rounded-2xl bg-black/60 border border-emerald-500/30 text-center relative overflow-hidden">
          {/* Payline Golden Laser Line */}
          <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent pointer-events-none opacity-40 z-10" />

          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-2 relative z-20">
            {reels.map((s, i) => {
              const meta = SLOT_SYMBOLS[s] || { name: s, color: 'border-slate-700 bg-slate-900' };
              return (
                <div
                  key={i}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 flex flex-col items-center justify-center text-3xl sm:text-4xl transition-all ${
                    lastPayout 
                      ? 'border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.6)] scale-105 bg-amber-950/40' 
                      : `${meta.color} shadow-md`
                  } ${isSpinning ? 'animate-pulse' : ''}`}
                >
                  <span>{s}</span>
                  <span className="text-[8px] font-mono font-bold tracking-tight text-white/80 uppercase mt-0.5">
                    {meta.name}
                  </span>
                </div>
              );
            })}
          </div>

          <p className={`text-xs font-bold ${lastPayout ? 'text-amber-300 animate-pulse text-sm' : 'text-slate-200'}`}>
            {message}
          </p>
        </div>

        {/* Visual Outcome Matrix & Paytable Payout Grid */}
        <div className="mb-2.5 p-2.5 rounded-2xl bg-slate-950/70 border border-white/10">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
              <Award className="w-3 h-3 text-amber-400" />
              Visual Payout & Multiplier Matrix
            </span>
            <span className="text-[9px] font-mono text-emerald-400">
              Active Wager: {isFree ? 'FREE (1x)' : `${betTier === 25 ? 'High Roller (2.5x)' : 'Standard (1x)'}`}
            </span>
          </div>

          <div className="grid grid-cols-6 gap-1.5 text-center text-[10px]">
            {SYMBOL_KEYS.map((key) => {
              const sym = SLOT_SYMBOLS[key];
              const effectivePayout = Math.round(sym.basePayout * (isFree ? 1.0 : multiplier));
              const isMatch = !isSpinning && reels[0] === key && reels[1] === key && reels[2] === key;
              return (
                <div
                  key={key}
                  className={`p-1.5 rounded-xl border transition-all ${
                    isMatch
                      ? 'bg-amber-400 text-slate-950 border-amber-300 font-extrabold scale-105 shadow-md'
                      : 'bg-black/40 border-white/10 text-slate-300'
                  }`}
                >
                  <div className="text-base sm:text-lg">{sym.icon}</div>
                  <div className="font-mono font-extrabold text-amber-300 text-[11px] leading-tight mt-0.5">
                    R{effectivePayout}
                  </div>
                  <div className="text-[8px] opacity-70 font-mono">
                    {sym.multiplierText}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Visual Input: Bet Tier Selector & Wallet Bar */}
        <div className="grid grid-cols-3 gap-2 mb-2.5">
          {/* Bet Tier Option 1: Free Turns */}
          <button
            onClick={() => {}}
            disabled={!isFree}
            className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${
              isFree
                ? 'bg-pink-500/20 border-pink-400 text-pink-300 shadow-xs'
                : 'bg-black/30 border-white/5 text-slate-500 opacity-60 cursor-not-allowed'
            }`}
          >
            <span className="text-[9px] font-mono uppercase font-bold flex items-center gap-1">
              <Gift className="w-3 h-3" /> Free Turn
            </span>
            <span className="text-xs font-black text-white mt-0.5">
              {freeSpinsRemaining} Left
            </span>
          </button>

          {/* Bet Tier Option 2: Standard R10 */}
          <button
            onClick={() => setBetTier(10)}
            className={`p-2 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all ${
              !isFree && betTier === 10
                ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 ring-1 ring-emerald-400 shadow-md'
                : 'bg-black/40 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <span className="text-[9px] font-mono uppercase font-bold">Standard Bet</span>
            <span className="text-xs font-black text-white mt-0.5">R 10 (1.0x)</span>
          </button>

          {/* Bet Tier Option 3: High Roller R25 */}
          <button
            onClick={() => setBetTier(25)}
            className={`p-2 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all ${
              !isFree && betTier === 25
                ? 'bg-amber-500/25 border-amber-400 text-amber-300 ring-1 ring-amber-400 shadow-md'
                : 'bg-black/40 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <span className="text-[9px] font-mono uppercase font-bold text-amber-300">High Roller</span>
            <span className="text-xs font-black text-amber-200 mt-0.5">R 25 (2.5x)</span>
          </button>
        </div>

        {/* Authentication Warning if Guest */}
        {!user.isSignedIn && (
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-400/40 text-center mb-2.5">
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

        {/* Wallet & Top Up Status */}
        <div className="bg-black/50 rounded-xl px-3 py-2 border border-amber-500/20 flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-300">Wallet Balance:</span>
            <span className="text-sm font-mono font-black text-white">
              R {user.walletBalance.toFixed(2)}
            </span>
          </div>
          <button
            onClick={() => { onClose(); onOpenWallet(); }}
            className="text-[10px] bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 px-2.5 py-1 rounded-lg font-bold cursor-pointer"
          >
            Top Up
          </button>
        </div>

        {/* Spin Action Button */}
        <button
          onClick={handleStartSpin}
          disabled={isSpinning || !canAfford}
          className={`w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer ${
            isSpinning
              ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
              : canAfford
              ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 hover:from-pink-400 hover:to-amber-300 text-white shadow-[0_0_25px_rgba(255,0,85,0.45)] hover:scale-[1.01] active:scale-95'
              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
          }`}
        >
          {isSpinning ? (
            <>
              <span className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
              <span>Reels Spinning In Real-Time...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>
                {isFree ? 'Pull 3D Lever (FREE TURN)' : `Pull 3D Lever (Play R${currentCost})`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Visual Recent Outcomes Strip */}
        {recentOutcomes.length > 0 && (
          <div className="mt-3 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              <span className="flex items-center gap-1">
                <History className="w-3 h-3 text-emerald-400" />
                Recent Spins Ledger
              </span>
              <span>Visual Log</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px] font-mono">
              {recentOutcomes.map((rec) => (
                <div
                  key={rec.id}
                  className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 shrink-0 ${
                    rec.isWin
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                      : 'bg-black/40 border-white/10 text-slate-400'
                  }`}
                >
                  <span>{rec.symbols.join('')}</span>
                  <span className={`text-[10px] font-bold ${rec.isWin ? 'text-amber-300' : 'text-slate-500'}`}>
                    {rec.isWin ? `+R${rec.payout}` : 'Miss'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
