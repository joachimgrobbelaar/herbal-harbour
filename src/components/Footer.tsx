import React from 'react';
import { CannabisLeafIcon } from './CannabisLeafIcon';

interface FooterProps {
  onOpenAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin }) => {
  return (
    <footer className="bg-forest-900 text-leaf-300 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        
        {/* Top 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 pb-14 border-b border-emerald-900/40">
          
          {/* Col 1: Brand & Bio */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center">
                <CannabisLeafIcon className="w-6 h-6 text-emerald-300" />
              </div>
              <span className="text-2xl font-black tracking-tight font-heading text-white">
                Herbal <span className="text-[#25a86a]">Harbour</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6 max-w-sm">
              A South African shop for medicinal cannabis and CBD. Order online or buy in store. Prices are in rand.
            </p>
          </div>

          {/* Col 2: Dispensary Categories */}
          <div className="lg:col-span-2 space-y-2.5 text-xs">
            <h4 className="text-white font-bold uppercase tracking-wider text-xs mb-3 font-heading">
              Categories
            </h4>
            <ul className="space-y-2">
              <li><a href="#catalog-section" className="hover:text-emerald-400 transition-colors">Flower</a></li>
              <li><a href="#catalog-section" className="hover:text-emerald-400 transition-colors">Seeds</a></li>
              <li><a href="#catalog-section" className="hover:text-emerald-400 transition-colors">CBD oils</a></li>
              <li><a href="#catalog-section" className="hover:text-emerald-400 transition-colors">Edibles</a></li>
              <li><a href="#catalog-section" className="hover:text-emerald-400 transition-colors">Concentrates</a></li>
              <li><a href="#catalog-section" className="hover:text-emerald-400 transition-colors">Topicals</a></li>
            </ul>
          </div>

          {/* Col 3: Patient Care & Delivery */}
          <div className="lg:col-span-2 space-y-2.5 text-xs">
            <h4 className="text-white font-bold uppercase tracking-wider text-xs mb-3 font-heading">
              Ordering
            </h4>
            <ul className="space-y-2">
              <li>EFT or pay on collection</li>
              <li>Courier R95</li>
              <li>Free courier over R750</li>
            </ul>
          </div>

          {/* Col 4: Newsletter & Vouchers */}
          <div className="lg:col-span-4">
            <h4 className="text-white font-bold uppercase tracking-wider text-xs mb-2 font-heading">
              Payment
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              There is no card payment on the site. Orders stay pending until an EFT is confirmed, or until you pay on collection.
            </p>
          </div>

        </div>

        <section className="pt-10 text-xs text-slate-400" aria-labelledby="model-credits">
          <h2 id="model-credits" className="text-white font-bold uppercase tracking-wider text-xs mb-3">
            3D model credits
          </h2>
          <p className="mb-3 max-w-3xl leading-relaxed">
            These models are used under <a className="underline text-leaf-300" href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. They were optimized for the web.
          </p>
          <ul className="space-y-1.5 leading-relaxed">
            <li>
              <a className="underline text-leaf-300" href="https://sketchfab.com/3d-models/2e7d1b77d5044d8cada3973cac9f387e">Cannabis Bud</a>
              {' '}by Mat Rex (<a className="underline" href="https://sketchfab.com/mriexinger">@mriexinger</a>)
            </li>
            <li>
              <a className="underline text-leaf-300" href="https://sketchfab.com/3d-models/f8bab377d4b34f0791b4cb9ed6ba55ea">Cannaleaf</a>
              {' '}by <a className="underline" href="https://sketchfab.com/s1ck086">s1ck086</a>
            </li>
            <li>
              <a className="underline text-leaf-300" href="https://sketchfab.com/3d-models/ede22e7628ad4d9ea9283e0f6e6266b2">Flowering cannabis plant in a pot</a>
              {' '}by Vladislav Jarmonov (<a className="underline" href="https://sketchfab.com/tafelynx">@tafelynx</a>)
            </li>
            <li>
              <a className="underline text-leaf-300" href="https://sketchfab.com/3d-models/99487445fdb94cd68f6183978e00ff4a">Treatment serum dropper bottle</a>
              {' '}by <a className="underline" href="https://sketchfab.com/Ideekay_012">Ideekay_012</a>
            </li>
            <li>
              <a className="underline text-leaf-300" href="https://sketchfab.com/3d-models/5f247d832906402fb71c4af5cba5843d">Seed</a>
              {' '}by <a className="underline" href="https://sketchfab.com/alecz1k">alecz1k</a>
            </li>
          </ul>
        </section>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} Herbal Harbour
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            {onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
              >
                Shop desk
              </button>
            )}
          </div>
        </div>

      </div>
    </footer>
  );
};
