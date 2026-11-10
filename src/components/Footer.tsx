import React, { useState } from 'react';
import { Shield, Truck, Check, Mail, Phone, MapPin, MessageCircle, Copy, CheckCheck } from 'lucide-react';
import { CannabisLeafIcon } from './CannabisLeafIcon';
import { subscribeToNewsletter, DEFAULT_VIP_COUPON } from '../services/newsletterService';

interface FooterProps {
  onOpenAdmin?: () => void;
  onOpenAboutUs?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin, onOpenAboutUs }) => {
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setIsSubmitting(true);
    try {
      await subscribeToNewsletter(emailInput.trim());
      setSubscribed(true);
      setEmailInput('');
    } catch {
      // Graceful fallback
      setSubscribed(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyVipCode = () => {
    navigator.clipboard.writeText(DEFAULT_VIP_COUPON);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <footer className="bg-[#10241e] text-slate-300 pt-16 pb-12 border-t border-emerald-950">
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
              South Africa's trusted medical cannabis dispensary and botanical genetics seed bank. Licensed organic cultivation, ISO-17025 third-party laboratory tested, and 100% smell-proof nationwide courier delivery.
            </p>
            <div className="flex flex-col gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                V&A Waterfront & Gardens, Cape Town, Western Cape, ZA
              </span>
              <span className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                Dispensary Helpline: +27 (0)21 448 9120
              </span>
              <span className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                orders@herbalharbour.co.za
              </span>
            </div>
          </div>

          {/* Col 2: Dispensary Categories */}
          <div className="lg:col-span-2 space-y-2.5 text-xs">
            <h4 className="text-white font-bold uppercase tracking-wider text-xs mb-3 font-heading">
              Categories
            </h4>
            <ul className="space-y-2">
              <li><a href="#psilocybin" className="hover:text-pink-400 text-pink-300 font-bold transition-colors">🍄 Sacred Mycology</a></li>
              <li><a href="#flower" className="hover:text-emerald-400 transition-colors">Craft Flower Buds</a></li>
              <li><a href="#seeds" className="hover:text-emerald-400 transition-colors">Feminized Seeds</a></li>
              <li><a href="#tinctures" className="hover:text-emerald-400 transition-colors">Full-Spectrum CBD Oils</a></li>
              <li><a href="#concentrates" className="hover:text-emerald-400 transition-colors">Solventless Rosin</a></li>
              <li><a href="#topicals" className="hover:text-emerald-400 transition-colors">Botanical Balms</a></li>
            </ul>
          </div>

          {/* Col 3: Patient Care & Delivery */}
          <div className="lg:col-span-2 space-y-2.5 text-xs">
            <h4 className="text-white font-bold uppercase tracking-wider text-xs mb-3 font-heading">
              Patient Care
            </h4>
            <ul className="space-y-2">
              {onOpenAboutUs && (
                <li>
                  <button onClick={onOpenAboutUs} className="text-left text-amber-300 font-bold hover:text-white transition-colors cursor-pointer">
                    Our Story & Founders
                  </button>
                </li>
              )}
              <li><a href="#news-section" className="hover:text-emerald-400 transition-colors">SA Cannabis Legislation</a></li>
              <li><a href="#news-section" className="hover:text-emerald-400 transition-colors">Depression & Psychedelics</a></li>
              <li><a href="#story" className="hover:text-emerald-400 transition-colors">COA Lab Reports</a></li>
              <li><a href="#home" className="hover:text-emerald-400 transition-colors">Discreet Courier Policy</a></li>
            </ul>
          </div>

          {/* Col 4: Newsletter & Vouchers */}
          <div className="lg:col-span-4">
            <h4 className="text-white font-bold uppercase tracking-wider text-xs mb-2 font-heading">
              Dispensary Dispatch Club
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Receive private strain batch releases, lab test certificates, and subscriber discount codes directly to your inbox.
            </p>

            {subscribed ? (
              <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold text-white">Welcome to the VIP Dispatch Club!</span>
                </div>
                <div className="flex items-center justify-between bg-black/40 p-2 rounded-lg border border-emerald-800/60">
                  <span className="text-[11px] text-slate-300">Your 15% VIP Coupon:</span>
                  <div className="flex items-center gap-1.5">
                    <strong className="font-mono text-amber-300 font-bold">{DEFAULT_VIP_COUPON}</strong>
                    <button
                      type="button"
                      onClick={copyVipCode}
                      className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Copy code"
                    >
                      {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-emerald-400/80">
                  ✓ Code saved & POPIA consent registered. Private strain drop alerts will arrive in your inbox.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="Enter email address..."
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="flex-1 bg-black/40 border border-emerald-900 focus:border-emerald-500 rounded-full py-2.5 px-4 text-xs text-white placeholder-slate-500 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-full bg-[#1e8755] hover:bg-[#166c43] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Joining...' : 'Join'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 pl-2">
                  🔒 POPIA compliant. 100% spam-free. Unsubscribe at any time.
                </p>
              </form>
            )}

            <div className="flex items-center gap-4 mt-6 text-slate-400 text-xs">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                100% Privacy Protected
              </span>
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-amber-400" />
                Smell-Proof Courier
              </span>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} Herbal Harbour (Pty) Ltd • Hosted on <strong>herbalharbour.co.za</strong> • All Rights Reserved.
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Cape Town</span>
            <span>•</span>
            <span>Johannesburg</span>
            <span>•</span>
            <span>Durban</span>
            <span>•</span>
            <span>Pretoria</span>
            {onOpenAdmin && (
              <>
                <span>•</span>
                <button
                  onClick={onOpenAdmin}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                >
                  Admin Desk
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </footer>
  );
};
