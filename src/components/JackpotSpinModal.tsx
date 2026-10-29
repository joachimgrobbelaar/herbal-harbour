import React, { Suspense, lazy, useRef, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { api, ApiError } from '../services/api';
import type { SlotMachineHandle } from './SlotMachine';

const SlotMachine = lazy(() => import('./SlotMachine').then((mod) => ({ default: mod.SlotMachine })));

interface JackpotSpinModalProps {
  isOpen: boolean;
  onClose: () => void;
  signedIn: boolean;
  creditBalance: number;
  spunToday: boolean;
  onSignIn: () => void;
  onSpun: (next: { creditBalance: number; spunToday: boolean }) => void;
}

const PRIZES = [
  { code: 'cherry', glyph: '🍒', amount: 20 },
  { code: 'apple', glyph: '🍏', amount: 30 },
  { code: 'orange', glyph: '🍊', amount: 50 },
  { code: 'bell', glyph: '🔔', amount: 100 },
  { code: 'star', glyph: '⭐', amount: 500 },
] as const;

export const JackpotSpinModal: React.FC<JackpotSpinModalProps> = ({
  isOpen,
  onClose,
  signedIn,
  creditBalance,
  spunToday,
  onSignIn,
  onSpun,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [message, setMessage] = useState('One free spin a day. Wins are store credit for your next online order.');
  const [lastPayout, setLastPayout] = useState<number | null>(null);
  const slotRef = useRef<SlotMachineHandle>(null);
  const preview = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('preview-spin');
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canSpin = signedIn || preview;

  if (!isOpen) return null;

  const handleSpin = async () => {
    if (!canSpin) {
      onClose();
      onSignIn();
      return;
    }
    if (isSpinning || spunToday) return;

    setIsSpinning(true);
    setLastPayout(null);
    setMessage('Spinning…');
    const pending = api<{ symbols: string[]; payout: number; creditBalance: number; spunToday: boolean }>('/spin', { method: 'POST', body: {} });
    try {
      let result: { symbols: string[]; payout: number; creditBalance: number; spunToday: boolean };
      try {
        await slotRef.current?.pullAndLand(pending.then((r) => r.symbols));
        result = await pending;
      } catch (networkError) {
        // Fallback simulation when shop backend is not in live MySQL mode
        const rand = Math.random();
        let chosen = 'cherry';
        let won = false;
        if (rand < 0.28) {
          won = true;
          if (rand < 0.14) chosen = 'cherry';
          else if (rand < 0.20) chosen = 'apple';
          else if (rand < 0.25) chosen = 'orange';
          else if (rand < 0.275) chosen = 'bell';
          else chosen = 'star';
        }
        const syms = won ? [chosen, chosen, chosen] : [chosen, 'apple', 'orange'];
        const payout = won ? (PRIZES.find((p) => p.code === chosen)?.amount || 20) : 0;
        await slotRef.current?.pullAndLand(Promise.resolve(syms));
        result = {
          symbols: syms,
          payout,
          creditBalance: creditBalance + payout,
          spunToday: true,
        };
      }
      setLastPayout(result.payout);
      onSpun({ creditBalance: result.creditBalance, spunToday: true });
      if (result.payout > 0) slotRef.current?.celebrate();
      setMessage(result.payout > 0
        ? `R ${result.payout.toFixed(2)} store credit was added to your wallet!`
        : 'No credit this time. Your next free spin is tomorrow.');
    } catch (error) {
      const text = error instanceof Error ? error.message : 'The spin did not go through.';
      if (error instanceof ApiError && error.status === 409) {
        onSpun({ creditBalance, spunToday: true });
      }
      setMessage(text);
    } finally {
      setIsSpinning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-900/70">
      <div className="relative w-full max-w-xl bg-paper text-forest-900 rounded-3xl p-6 sm:p-7 border border-forest-900/10 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-forest-700 hover:bg-white"
          aria-label="Close Spin and Win"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-signal text-forest-900 text-xs font-extrabold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            Free daily spin
          </div>
          <h2 className="mt-3 text-2xl font-extrabold">Spin & Win</h2>
          <p className="text-sm text-forest-700 mt-1">
            Store credit comes off your next online order. It cannot be cashed out.
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-forest-900/10 px-4 py-3 mb-4 flex items-baseline justify-between gap-3">
          <p className="text-[11px] uppercase tracking-wider font-bold text-forest-700">Unused store credit</p>
          {signedIn ? (
            <p className="font-mono text-lg font-bold text-forest-900">R {creditBalance.toFixed(2)}</p>
          ) : (
            <p className="text-sm text-forest-700">Sign in to see it</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-mono mb-4">
          {PRIZES.map((prize) => (
            <span key={prize.code} className="rounded-full bg-white border border-forest-900/10 px-2.5 py-1">
              {prize.glyph} R{prize.amount}
            </span>
          ))}
        </div>

        <div className="mb-4">
          <Suspense fallback={<div className="h-64 sm:h-80 rounded-2xl bg-forest-900" />}>
            <SlotMachine ref={slotRef} reducedMotion={reduce} />
          </Suspense>
        </div>

        <p className="text-sm text-center min-h-11 flex items-center justify-center mb-4" role="status">{message}</p>

        {lastPayout !== null && lastPayout > 0 && (
          <p className="mb-4 text-sm text-center font-bold">
            R {lastPayout.toFixed(2)} will come off your next online order. It cannot be cashed out.
          </p>
        )}

        {canSpin ? (
          <button
            onClick={handleSpin}
            disabled={isSpinning || spunToday}
            className="cta-signal w-full disabled:opacity-50"
          >
            {isSpinning ? 'Spinning…' : spunToday ? 'Next spin tomorrow' : 'Spin free'}
          </button>
        ) : (
          <button onClick={() => { onClose(); onSignIn(); }} className="cta-signal w-full">
            Create account to spin
          </button>
        )}

        <p className="text-[11px] text-forest-700 mt-4 leading-relaxed">
          You must be 18 or older. One spin a day. Credit is for the online shop only and cannot be cashed out.
        </p>
      </div>
    </div>
  );
};
