import React from 'react';
import { Truck, CheckCircle2, ShoppingBag, CreditCard, ShieldCheck, Sparkles, Box } from 'lucide-react';
import { GlbViewer } from './GlbViewer';

export const HowToOrderSection: React.FC = () => {
  return (
    <section id="how-to-order-section" className="py-16 sm:py-20 bg-white border-b border-slate-200/80 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        
        {/* Main 2-Column Balanced Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Narrative & 3-Step Flow */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 text-emerald-800 text-xs font-bold tracking-wider uppercase mb-2">
              <Truck className="w-4 h-4 text-[#25a86a]" />
              <span>Nationwide South African Dispatch</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#112d23] tracking-tight font-heading mb-4 leading-tight">
              How to Order Your Medical Cannabis & CBD
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-8 max-w-xl">
              We provide compliant, laboratory-verified herbal medicine straight to your door with end-to-end discreet tracked shipping across all nine provinces.
            </p>

            {/* 3 Step Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Step 1 */}
              <div className="bg-[#f7f9f7] rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono font-bold text-xs text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                    01
                  </span>
                  <ShoppingBag className="w-4 h-4 text-emerald-700" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm font-heading mb-1.5">
                  Choose Medicine
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Browse lab-tested flower, oils, seeds, or edibles. Filter by cannabinoid specs and add to cart.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-[#f7f9f7] rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono font-bold text-xs text-amber-800 bg-amber-100/70 px-2.5 py-0.5 rounded-full">
                    02
                  </span>
                  <CreditCard className="w-4 h-4 text-amber-700" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm font-heading mb-1.5">
                  Flexible Payment
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pay instantly via Google Pay, Patient Wallet balance, Instant EFT, or cash on local collection.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-[#f7f9f7] rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono font-bold text-xs text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                    03
                  </span>
                  <Truck className="w-4 h-4 text-emerald-700" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm font-heading mb-1.5">
                  Discreet Delivery
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Speedy courier (R95 or FREE over R750). Odour-sealed, tamper-evident discreet packaging.
                </p>
              </div>

            </div>

            {/* Compliance Guarantee */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs text-slate-600 font-medium">
              <span className="flex items-center gap-1.5 text-emerald-800 font-bold">
                <CheckCircle2 className="w-4 h-4 text-[#25a86a]" />
                100% Legal Patient Access
              </span>
              <span className="flex items-center gap-1.5 text-emerald-800 font-bold">
                <ShieldCheck className="w-4 h-4 text-[#25a86a]" />
                HPLC Laboratory Verified
              </span>
              <span className="flex items-center gap-1.5 text-emerald-800 font-bold">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Free Courier on Orders R750+
              </span>
            </div>
          </div>

          {/* Right Column: 3D Botanical Display & Fixed Visual Balance */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 bg-gradient-to-br from-[#122e24] via-[#1a4437] to-[#0e241d] p-3">
              
              {/* 3D Botanical Stage with Extended Border Clearance */}
              <div className="relative h-84 sm:h-96 rounded-2xl bg-black/30 overflow-hidden flex items-center justify-center p-2">
                <GlbViewer
                  src="assets/models/cannabis_sativa_plant.glb"
                  className="w-full h-full"
                  enableFloating={true}
                  enableControls={true}
                  scaleMultiplier={1.0}
                  cameraDistance={3.8}
                />

                {/* Floating Delivery Quality Badge */}
                <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md rounded-xl p-3 border border-white/60 shadow-lg flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
                      Discreet Nationwide Delivery
                    </span>
                    <span className="text-xs font-black text-slate-900">
                      Standard Courier: 24–48 Hours
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    R95 / FREE &gt; R750
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};