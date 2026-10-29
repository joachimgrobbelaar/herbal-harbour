import React, { useState } from 'react';
import { Sparkles, Trophy, X, Gift, Volume2, VolumeX, ShieldCheck, ArrowRight, Wallet, Check } from 'lucide-react';
import { sound } from '../utils/audio';
import { triggerConfetti } from '../utils/confetti';
import { UserProfile } from './WalletModal';

interface WheelPrize {
  id: string;
  label: string;
  color: string;
  textColor: string;
  description: string;
  code: string;
  walletBonus?: number;
}

const PRIZES: WheelPrize[] = [
  { id: '1', label: 'R100 Courier Voucher', color: '#143329', textColor: '#d8f3dc', description: 'Free express courier delivery on your next Herbal Harbour order', code: 'HH-COURIER-100', walletBonus: 100 },
  { id: '2', label: 'Matchbox Pre-Roll Duo', color: '#1e8755', textColor: '#ffffff', description: 'Artisanal organic landrace pre-roll pack added to your next order', code: 'HH-MATCHBOX-DUO' },
  { id: '3', label: '20% Off Dispensary', color: '#25a86a', textColor: '#ffffff', description: '20% off all craft flower and concentrates over R500', code: 'HH-DISPENSARY-20' },
  { id: '4', label: 'CBD Herbal Drops (R50)', color: '#3bb97c', textColor: '#081c15', description: 'R50 direct patient wallet credit for sublingual CBD tinctures', code: 'HH-CBD-CREDIT-50', walletBonus: 50 },
  { id: '5', label: 'VIP Lounge Pass', color: '#e5a83b', textColor: '#081c15', description: 'Exclusive secret harvest sessions & invite-only strain drops', code: 'HH-VIP-ACCESS-420' },
  { id: '6', label: 'Double Spin Boost', color: '#52b788', textColor: '#081c15', description: '2 bonus spins on the Herbal Harbour lucky wheel', code: 'HH-BONUS-SPIN2' },
  { id: '7', label: 'R250 Craft Gift Box', color: '#f59e0b', textColor: '#081c15', description: 'R250 wallet credit toward organic papers, rolling tray & clipper', code: 'HH-CRAFT-BOX-250', walletBonus: 250 },
  { id: '8', label: 'Secret Garden Access', color: '#d8f3dc', textColor: '#081c15', description: 'Private tasting invite & farm-to-table botanical session', code: 'HH-SECRET-GARDEN' },
];

interface CannaSpinWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateWallet: (newBalance: number) => void;
  onOpenWallet: () => void;
}

export const CannaSpinWheelModal: React.FC<CannaSpinWheelModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateWallet,
  onOpenWallet
}) => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<WheelPrize | null>(null);
  const [spinsLeft, setSpinsLeft] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('hh_wheel_spins');
      return saved !== null ? parseInt(saved, 10) : 3;
    } catch {
      return 3;
    }
  });
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    sound.setMuted(next);
  };

  const handleSpin = () => {
    if (!user.isSignedIn) {
      onClose();
      onOpenWallet();
      return;
    }
    if (spinning || spinsLeft <= 0) return;

    setSpinning(true);
    setWonPrize(null);
    setCopiedCode(false);

    sound.startSpin(4200);

    const prizeIndex = Math.floor(Math.random() * PRIZES.length);
    const sliceDeg = 360 / PRIZES.length;
    const extraRounds = 5 * 360;
    const targetSliceAngle = (PRIZES.length - prizeIndex - 0.5) * sliceDeg;
    const finalAngle = rotation + extraRounds + (targetSliceAngle - (rotation % 360) + 360) % 360;

    setRotation(finalAngle);

    setTimeout(() => {
      setSpinning(false);
      const newSpins = Math.max(0, spinsLeft - 1);
      setSpinsLeft(newSpins);
      localStorage.setItem('hh_wheel_spins', newSpins.toString());

      const selected = PRIZES[prizeIndex];
      setWonPrize(selected);
      sound.playWin();
      triggerConfetti();

      // If prize has direct wallet bonus, credit to user wallet
      if (selected.walletBonus && selected.walletBonus > 0) {
        onUpdateWallet(user.walletBalance + selected.walletBonus);
      }
    }, 4200);
  };

  const copyCodeToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-[#122e24] via-[#16382c] to-[#0c1f19] border border-emerald-600/40 rounded-3xl shadow-2xl overflow-hidden my-6 text-white">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-emerald-800/40 flex items-center justify-between bg-black/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-sm shadow-md">
              🎡
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-wide flex items-center gap-2 font-heading">
                Herbal Harbour • CannaSpin & Win
              </h3>
              <p className="text-[11px] text-emerald-300 font-mono">
                Dispensary Drops, Courier Credits & Daily Vouchers
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSound}
              className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center">
          
          {/* Top User Status & Free Spins Bar */}
          <div className="w-full flex items-center justify-between gap-3 bg-black/40 p-3 rounded-2xl border border-white/5 mb-5 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>Wallet:</span>
              <span className="font-mono font-bold text-amber-300">R {user.walletBalance.toFixed(2)}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-amber-400" />
              <span>Daily Spins:</span>
              <span className="font-mono font-bold text-white px-2 py-0.5 rounded-full bg-emerald-800 text-[11px]">
                {spinsLeft} Left
              </span>
            </div>
          </div>

          {/* Wheel Container */}
          <div className="relative w-72 h-72 sm:w-84 sm:h-84 my-2 flex items-center justify-center">
            {/* Top Indicator Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[26px] border-t-amber-400 drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)]" />

            {/* Spinning SVG Wheel */}
            <svg
              className="w-full h-full rounded-full shadow-[0_0_50px_rgba(20,51,41,0.8)] transition-transform duration-[4200ms] cubic-bezier(0.12, 0.8, 0.32, 1)"
              style={{ transform: `rotate(${rotation}deg)` }}
              viewBox="0 0 300 300"
            >
              {PRIZES.map((prize, idx) => {
                const angle = 360 / PRIZES.length;
                const startAngle = idx * angle;
                const endAngle = (idx + 1) * angle;
                const startRad = (startAngle * Math.PI) / 180;
                const endRad = (endAngle * Math.PI) / 180;
                const x1 = 150 + 145 * Math.cos(startRad);
                const y1 = 150 + 145 * Math.sin(startRad);
                const x2 = 150 + 145 * Math.cos(endRad);
                const y2 = 150 + 145 * Math.sin(endRad);

                const midAngle = startAngle + angle / 2;
                const textRad = (midAngle * Math.PI) / 180;
                const textX = 150 + 95 * Math.cos(textRad);
                const textY = 150 + 95 * Math.sin(textRad);

                return (
                  <g key={prize.id}>
                    <path
                      d={`M 150 150 L ${x1} ${y1} A 145 145 0 0 1 ${x2} ${y2} Z`}
                      fill={prize.color}
                      stroke="#0f291e"
                      strokeWidth="2.5"
                    />
                    <text
                      x={textX}
                      y={textY}
                      fill={prize.textColor}
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                      textAnchor="middle"
                      dominantBaseline="central"
                      transform={`rotate(${midAngle + 90}, ${textX}, ${textY})`}
                    >
                      {prize.label}
                    </text>
                  </g>
                );
              })}
              {/* Outer Golden Rim */}
              <circle cx="150" cy="150" r="145" fill="none" stroke="#e5a83b" strokeWidth="4" />
              {/* Center Dispensary Hub */}
              <circle cx="150" cy="150" r="28" fill="#143329" stroke="#e5a83b" strokeWidth="3" />
              <text x="150" y="153" textAnchor="middle" fontSize="16" fill="#e5a83b" fontWeight="black">
                🌿
              </text>
            </svg>
          </div>

          {/* Won Prize Banner */}
          {wonPrize && (
            <div className="w-full mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-amber-500/20 border border-amber-400/50 text-center animate-fade-in space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-xs uppercase font-extrabold text-amber-300">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>CONGRATULATIONS PATIENT WINNER!</span>
              </div>
              <h4 className="text-lg font-black text-white">{wonPrize.label}</h4>
              <p className="text-xs text-emerald-100">{wonPrize.description}</p>

              {wonPrize.walletBonus && (
                <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-300 font-mono font-bold text-xs">
                  ✓ +R{wonPrize.walletBonus} Added Directly to Your Wallet Balance
                </div>
              )}

              <div className="pt-2 flex items-center justify-center gap-2">
                <span className="text-xs text-slate-300">Claim Code:</span>
                <code className="bg-black/60 px-3 py-1 rounded-lg font-mono font-bold text-amber-300 text-xs border border-amber-400/30">
                  {wonPrize.code}
                </code>
                <button
                  onClick={() => copyCodeToClipboard(wonPrize.code)}
                  className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                >
                  {copiedCode ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {/* Spin Button */}
          <div className="w-full mt-6">
            {!user.isSignedIn ? (
              <button
                onClick={() => { onClose(); onOpenWallet(); }}
                className="w-full py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>Log In to Spin & Win</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSpin}
                disabled={spinning || spinsLeft <= 0}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {spinning ? (
                  <span>Spinning Lucky Wheel…</span>
                ) : spinsLeft > 0 ? (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>Spin Wheel ({spinsLeft} Free Left)</span>
                  </>
                ) : (
                  <span>Out of Daily Spins (Come Back Tomorrow)</span>
                )}
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
