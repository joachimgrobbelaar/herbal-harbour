import React from 'react';
import { 
  ArrowLeft, 
  Heart, 
  ShieldCheck, 
  Sparkles, 
  Award, 
  Sprout, 
  Users, 
  Compass, 
  CheckCircle2, 
  MapPin, 
  FileText,
  Clock,
  Truck
} from 'lucide-react';
import { CannabisLeafIcon } from '../components/CannabisLeafIcon';

interface AboutUsPageProps {
  onBackToStore: () => void;
}

export const AboutUsPage: React.FC<AboutUsPageProps> = ({ onBackToStore }) => {
  return (
    <div className="min-h-screen bg-[#fafaf8] text-slate-800 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={onBackToStore}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dispensary</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#143329] flex items-center justify-center text-amber-400">
              <CannabisLeafIcon className="w-5 h-5 fill-current" />
            </div>
            <span className="font-heading font-black text-sm tracking-tight text-[#143329]">
              HERBAL HARBOUR & HUB
            </span>
          </div>

          <div className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            EST. 2024 • SOUTH AFRICA
          </div>
        </div>
      </header>

      {/* Hero Banner with Amsterdam Canal / Red Light District Botanical Vibe */}
      <section className="bg-gradient-to-b from-[#0e271e] via-[#143329] to-[#0a1f18] text-white py-16 sm:py-24 relative overflow-hidden">
        {/* Neon Glow Blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/20 border border-pink-400/40 text-pink-300 text-xs font-black tracking-widest uppercase shadow-[0_0_15px_rgba(255,0,85,0.3)]">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            OUR STORY & SACRED BOTANICAL MISSION
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-heading tracking-tight text-white leading-tight">
            Bridging Amsterdam Apothecary Culture with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-amber-200 to-emerald-300">
              South African Landrace Heritage
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Founded by a passionate collective of South African ethnobotanists and holistic health advocates, Herbal Harbour was created to transform botanical wellness into an ethical, joyful, and community-healing ecosystem.
          </p>
        </div>
      </section>

      {/* Main Narrative */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-12">
        
        {/* The Genesis */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-800">
            <Compass className="w-4 h-4 text-emerald-600" />
            <span>Chapter I • The Genesis</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black font-heading text-slate-900">
            From Pharmaceutical Burnout to Plant Medicine Sanctuary
          </h2>

          <div className="space-y-4 text-sm sm:text-base text-slate-700 leading-relaxed">
            <p>
              In 2024, our founding team set out with a straightforward conviction: South Africans deserved access to the same world-class, carefully curated botanical relief celebrated across Amsterdam’s historic coffeeshops and apothecary houses, without stigma, fear, or predatory pricing.
            </p>
            <p>
              Following years of watching loved ones struggle with the numbing side effects of synthetic psychiatric pharmaceuticals and opioid pain relievers, we returned to our continent’s indigenous botanical roots. South Africa is the ancestral cradle of legendary cultivars like <em>Durban Poison</em>, <em>Transkei Red</em>, and sacred natural remedies like <em>Kanna</em> (Sceletium tortuosum) and <em>Sutherlandia</em>.
            </p>
            <p>
              We combined these heirloom genetics with modern supercritical CO2 extraction and sacred mycology protocols to craft a patient-first sanctuary where healing is celebratory, transparent, and grounded in mutual aid.
            </p>
          </div>
        </div>

        {/* Core Business Goals */}
        <div className="space-y-6">
          <div className="text-center">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-700">OUR PILLARS</span>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-slate-900 mt-1">
              Three Core Pillars of Herbal Harbour
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-700 flex items-center justify-center font-bold">
                <Heart className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-lg font-black text-slate-900 font-heading">
                1. Automated 5% Social Giveback
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We believe commerce without social solidarity is empty. 5% of every order and R2 per Spin & Win turn automatically streams to the South African Cannabis Medical Relief Fund and Karoo Permaculture Gardens, subsidizing patient care.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Sparkles className="w-6 h-6 text-amber-700" />
              </div>
              <h3 className="text-lg font-black text-slate-900 font-heading">
                2. Destigmatizing Sacred Mycology
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                By pairing craft cannabis with functional psilocybin microdosing stacks (Golden Teacher, Lion's Mane, Niacin), we are pioneering treatment alternatives for treatment-resistant depression in full compliance with emerging South African research frameworks.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
                <Truck className="w-6 h-6 text-indigo-700" />
              </div>
              <h3 className="text-lg font-black text-slate-900 font-heading">
                3. Nationwide Discreet Doorstep Care
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                From Cape Town to Pretoria, Durban to the Kalahari, our smell-proof, climate-shielded courier network ensures verified adult patients receive their botanical orders within 24 to 48 hours with complete discretion.
              </p>
            </div>

          </div>
        </div>

        {/* Founders & Leadership Quote */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-[#143329] to-[#0e271e] text-white relative overflow-hidden">
          <div className="max-w-2xl space-y-4 relative z-10">
            <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
              MESSAGE FROM OUR FOUNDING COLLECTIVE
            </span>
            <blockquote className="text-lg sm:text-xl font-medium leading-relaxed italic text-emerald-100">
              "We didn't build Herbal Harbour to be another clinical dispensary or sterile pharmaceutical counter. We built it to bring back the warmth, the wonder, and the joyful community of Amsterdam's coffeehouse culture—while ensuring every South African patient gets pure, compassionate plant medicine they can trust."
            </blockquote>
            <div className="pt-2">
              <div className="font-heading font-black text-base text-white">The Herbal Harbour Collective</div>
              <div className="text-xs text-emerald-300">Botanical Stewards & Community Apothecary • Herbal Harbour & Hub</div>
            </div>
          </div>
        </div>

        {/* Back to store CTA */}
        <div className="text-center pt-4">
          <button
            onClick={onBackToStore}
            className="px-8 py-4 rounded-2xl bg-[#143329] hover:bg-[#1f4c3d] text-white font-black text-sm uppercase tracking-wider transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
          >
            Explore the Dispensary Catalog
          </button>
        </div>

      </main>

      {/* Footer */}
      <footer className="mt-auto bg-[#0a1f18] text-slate-400 py-8 px-4 text-center text-xs border-t border-emerald-900/40">
        <p>© 2026 Herbal Harbour Dispensary • Western Cape, South Africa • In compliance with Act No. 7 of 2024</p>
      </footer>
    </div>
  );
};
