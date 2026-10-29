import React, { useState } from 'react';
import { Heart, Sparkles, ShieldCheck, Users, Sprout, Building, ArrowUpRight, CheckCircle2, Coins } from 'lucide-react';

interface CharityImpactSectionProps {
  totalDonatedZAR: number;
}

interface CharityOrganization {
  id: string;
  name: string;
  tagline: string;
  allocationPercent: number;
  description: string;
  icon: typeof Heart;
  color: string;
  stats: string;
}

const CHARITIES: CharityOrganization[] = [
  {
    id: 'med-relief',
    name: 'SA Cannabis Medical Relief Fund',
    tagline: 'Compassionate Access for Chronic Patients',
    allocationPercent: 45,
    description: 'Provides free and heavily subsidised laboratory-certified CBD and full-spectrum cannabinoid tinctures to low-income pensioners, cancer patients, and severe neuropathic pain sufferers nationwide.',
    icon: ShieldCheck,
    color: '#10b981', // Emerald
    stats: '1,420+ Subsidised Patient Prescriptions'
  },
  {
    id: 'permaculture',
    name: 'Cape & Karoo Permaculture Gardens',
    tagline: 'Food Sovereignty & Indigenous Flora',
    allocationPercent: 35,
    description: 'Establishes community-managed regenerative micro-farms across Mitchells Plain, Khayelitsha, and the Great Karoo, cultivating indigenous medicinal plants (Dagga, Sutherlandia, Kanna) alongside organic food crops.',
    icon: Sprout,
    color: '#e5a83b', // Amber
    stats: '18 Active Community Sanctuaries'
  },
  {
    id: 'psychedelic-research',
    name: 'SA Harm Reduction & Psychedelic Research',
    tagline: 'Mental Health & Neuroplasticity Integration',
    allocationPercent: 20,
    description: 'Co-funding clinical neuropsychiatric research at South African academic hospitals studying psilocybin and plant medicines for treatment-resistant depression and trauma integration.',
    icon: Sparkles,
    color: '#ec4899', // Pink
    stats: '3 Clinical Integration Pilot Sites'
  }
];

export const CharityImpactSection: React.FC<CharityImpactSectionProps> = ({ totalDonatedZAR }) => {
  const goalAmountZAR = 100000;
  const progressPercent = Math.min(100, Math.round((totalDonatedZAR / goalAmountZAR) * 100));
  const [activeOrg, setActiveOrg] = useState<string>('med-relief');

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-[#0a1b14] via-[#0d261c] to-[#0a1b14] text-white relative overflow-hidden border-y border-emerald-500/20">
      {/* Background Neon Atmospheric Glow (Amsterdam Red Light / Emerald Glow) */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-300 text-xs font-black tracking-widest uppercase mb-3 shadow-[0_0_15px_rgba(236,72,153,0.3)]">
            <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400 animate-pulse" />
            <span>AUTOMATED COMMUNITY IMPACT FUND</span>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black font-heading tracking-tight text-white mb-4">
            Every Purchase & Spin Heals{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-amber-300 to-emerald-400">
              South African Communities
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            You never have to make a separate donation. Every single time you order craft botanicals (<strong>5%</strong> of total) or spin the 3D Slot Machine (<strong>R2.00</strong> per turn), funds automatically stream into verified medical relief and regenerative permaculture projects.
          </p>
        </div>

        {/* Live Fund Pot Hero Card */}
        <div className="bg-gradient-to-r from-[#122e23] via-[#16382b] to-[#122e23] rounded-3xl p-6 sm:p-10 border-2 border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.15)] mb-12 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left: Total Accumulated Counter */}
            <div className="lg:col-span-6 space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-400" />
                Live Automated Pot Collected
              </span>

              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-6xl font-black font-mono text-white tracking-tight">
                  R {totalDonatedZAR.toLocaleString('en-ZA')}
                </span>
                <span className="text-base sm:text-xl font-bold text-slate-400">
                  / R {goalAmountZAR.toLocaleString('en-ZA')} Goal
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5 pt-2">
                <div className="w-full h-4 rounded-full bg-black/60 p-0.5 border border-emerald-500/30 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-pink-500 via-amber-400 to-emerald-400 transition-all duration-1000 shadow-[0_0_12px_rgba(16,185,129,0.6)]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
                  <span>{progressPercent}% of 2026 Milestone Funded</span>
                  <span className="text-amber-300 font-bold">100% Transparent Distributed Ledger</span>
                </div>
              </div>
            </div>

            {/* Right: Automated Distribution Badges */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/20 backdrop-blur-xs flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-400/40 flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">5% of Every Order</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-tight">
                    Automatically deducted from store margins, zero markup passed to patient checkout.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/20 backdrop-blur-xs flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">R2.00 per Slot Spin</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-tight">
                    Every paid turn directly deposits store credit matching funds into grassroots charities.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Beneficiary Non-Profits Breakdown Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CHARITIES.map((org) => {
            const IconComp = org.icon;
            const isSelected = activeOrg === org.id;

            return (
              <div
                key={org.id}
                onClick={() => setActiveOrg(org.id)}
                className={`p-6 rounded-3xl transition-all cursor-pointer relative overflow-hidden border-2 ${
                  isSelected
                    ? 'bg-[#14362a] border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.3)] scale-[1.02]'
                    : 'bg-[#0f281f]/80 border-emerald-500/20 hover:border-emerald-400/50 hover:bg-[#14362a]/60'
                }`}
              >
                {/* Top Allocation Header */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center border"
                    style={{ backgroundColor: `${org.color}20`, borderColor: `${org.color}50` }}
                  >
                    <IconComp className="w-6 h-6" style={{ color: org.color }} />
                  </div>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-black font-mono border"
                    style={{ backgroundColor: `${org.color}15`, borderColor: `${org.color}40`, color: org.color }}
                  >
                    {org.allocationPercent}% Share
                  </span>
                </div>

                <h3 className="text-lg font-black text-white font-heading mb-1">
                  {org.name}
                </h3>
                <span className="text-xs font-bold text-amber-300 block mb-3">
                  {org.tagline}
                </span>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {org.description}
                </p>

                <div className="pt-3 border-t border-emerald-900/40 flex items-center justify-between text-xs font-bold text-emerald-300">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    {org.stats}
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
