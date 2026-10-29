import React, { useEffect, useState } from 'react';
import { HeartHandshake, Sprout, ShieldCheck, ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
import { getCharityStats, CommunityCharityStats, SA_CHARITY_INITIATIVES } from '../lib/charity';

interface CharityProgressProps {
  onOpenWallet?: () => void;
  signedIn?: boolean;
}

export const CharityProgress: React.FC<CharityProgressProps> = ({ onOpenWallet, signedIn }) => {
  const [stats, setStats] = useState<CommunityCharityStats>(getCharityStats);
  const [activeTab, setActiveTab] = useState<string>('fynbos');

  useEffect(() => {
    const handleUpdate = () => {
      setStats(getCharityStats());
    };
    window.addEventListener('hh-charity-updated', handleUpdate);
    return () => window.removeEventListener('hh-charity-updated', handleUpdate);
  }, []);

  const percentage = Math.min(100, Math.round((stats.totalRaised / stats.monthlyGoal) * 1000) / 10);
  const activeInitiative = stats.initiatives.find((i) => i.id === activeTab) || stats.initiatives[0];

  return (
    <section className="py-16 sm:py-20 bg-[#0d2114] text-paper border-t border-b border-emerald-900/40 relative overflow-hidden">
      {/* Background Subtle Ambience */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-signal/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-leaf-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="page-wrap relative">
        <div className="max-w-3xl mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-signal/10 border border-signal/20 text-signal font-mono text-xs font-bold uppercase tracking-wider mb-4">
            <Sprout className="w-3.5 h-3.5" />
            <span>Green Initiative · South African Conservation</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-paper font-heading leading-tight">
            Cultivating Healing & Preserving Indigenous Flora
          </h2>
          <p className="mt-3 text-base text-[#d7e3d4] leading-relaxed">
            Every rounded-up checkout and donated spin win directly protects endangered fynbos habitats and funds open-access botanical medicine research across South Africa.
          </p>
        </div>

        {/* Community Progress Banner */}
        <div className="bg-[#132a1a]/90 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl mb-10">
          <div className="grid sm:grid-cols-3 gap-6 items-center mb-6">
            <div>
              <span className="text-xs uppercase font-mono tracking-wider text-[#a9b8a6] block mb-1">
                Community Raised This Month
              </span>
              <div className="text-3xl sm:text-4xl font-black font-mono text-signal tabular-nums">
                R {stats.totalRaised.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div>
              <span className="text-xs uppercase font-mono tracking-wider text-[#a9b8a6] block mb-1">
                Monthly Conservation Target
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-paper tabular-nums">
                R {stats.monthlyGoal.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="sm:text-right">
              <span className="text-xs uppercase font-mono tracking-wider text-[#a9b8a6] block mb-1">
                Active Contributors
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-paper tabular-nums flex items-center sm:justify-end gap-1.5">
                <TrendingUp className="w-5 h-5 text-signal" />
                <span>{stats.donorCount} Patients</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono font-bold">
              <span className="text-signal flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{percentage}% Funded</span>
              </span>
              <span className="text-[#a9b8a6]">R {(stats.monthlyGoal - stats.totalRaised > 0 ? stats.monthlyGoal - stats.totalRaised : 0).toFixed(2)} to go</span>
            </div>

            <div className="w-full h-4 bg-black/40 rounded-full p-0.5 overflow-hidden border border-white/10 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-leaf-500 via-leaf-300 to-signal rounded-full transition-all duration-1000 ease-out shadow-sm"
                style={{ width: `${Math.min(100, percentage)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3 Interactive Partner Initiatives */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {stats.initiatives.map((init) => {
            const isSelected = activeTab === init.id;
            return (
              <button
                key={init.id}
                type="button"
                onClick={() => setActiveTab(init.id)}
                className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-white/10 border-signal text-paper shadow-md'
                    : 'bg-white/5 border-white/10 text-paper/80 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-signal font-bold">
                      {init.category}
                    </span>
                    <span className="text-xs font-mono font-bold text-signal">
                      R {init.currentRaised.toLocaleString('en-ZA')}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-paper mb-2">{init.name}</h3>
                  <p className="text-xs text-[#d7e3d4] leading-relaxed mb-4">{init.description}</p>
                </div>
                <div className="pt-3 border-t border-white/10 text-[11px] font-mono text-[#a9b8a6]">
                  {init.impactMetrics}
                </div>
              </button>
            );
          })}
        </div>

        {/* Call to Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-signal/10 border border-signal/20">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-signal shrink-0" />
            <p className="text-xs text-[#d7e3d4] leading-relaxed">
              100% of rounded cents and store credit donations are disbursed monthly with transparent public audit statements.
            </p>
          </div>

          {onOpenWallet && (
            <button
              onClick={onOpenWallet}
              className="px-5 py-2.5 rounded-full bg-signal hover:bg-white text-forest-900 font-extrabold text-xs tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer active:scale-95 shadow-xs flex items-center gap-2"
            >
              <HeartHandshake className="w-4 h-4" />
              <span>{signedIn ? 'Donate from Wallet' : 'Sign in to Donate'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
