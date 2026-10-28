import React, { useState } from 'react';
import { 
  Search, 
  Heart, 
  ShoppingBag, 
  Scale, 
  Sparkles, 
  Menu, 
  X,
  Truck,
  FileSpreadsheet,
  Wallet,
  MessageCircle
} from 'lucide-react';
import { CartItem, Product } from '../types';
import { CannabisLeafIcon } from './CannabisLeafIcon';
import { UserProfile } from './WalletModal';

interface HeaderProps {
  cartItems: CartItem[];
  wishlist: string[];
  comparedProducts: Product[];
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenCompare: () => void;
  onOpenJackpot: () => void;
  onOpenGoogleSheet: () => void;
  onOpenWallet: () => void;
  onOpenAdmin?: () => void;
  user: UserProfile;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectCategory: (cat: string) => void;
  isUsingGoogleSheet: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  cartItems,
  wishlist,
  comparedProducts,
  onOpenCart,
  onOpenWishlist,
  onOpenCompare,
  onOpenJackpot,
  onOpenGoogleSheet,
  onOpenWallet,
  onOpenAdmin,
  user,
  searchQuery,
  onSearchChange,
  onSelectCategory,
  isUsingGoogleSheet
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
      {/* Top Notification Announcement Bar */}
      <div className="bg-[#122e24] text-white text-[12px] py-1.5 px-4 sm:px-8 border-b border-emerald-950/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-emerald-200 truncate font-medium">
            <Truck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">
              Discreet Doorstep Delivery Nationwide (Free over R750) • South Africa (ZAR)
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Direct WhatsApp Quick Link */}
            <a
              href="https://wa.me/27824591234?text=Hi%20Herbal%20Harbour!%20I%20am%20browsing%20the%20dispensary%20and%20would%20like%20to%20order."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-emerald-300 hover:text-white font-medium text-[11px] transition-colors"
            >
              <MessageCircle className="w-3 h-3 text-[#25D366]" />
              <span className="hidden sm:inline">WhatsApp Us:</span>
              <span className="font-mono">+27 82 459 1234</span>
            </a>

            <span className="text-emerald-500/50">|</span>

            {/* Lucky Reel Promo Link */}
            <button
              onClick={onOpenJackpot}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] transition-transform active:scale-95 shadow cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span>🎰 Spin & Win (3 Free Spins)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-6">
        
        {/* BRAND LOGO with authentic 7-point Cannabis Leaf */}
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); onSelectCategory('all'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="flex items-center gap-2.5 group shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1d4c3c] to-[#0f2920] flex items-center justify-center text-[#25a86a] shadow-sm group-hover:scale-105 transition-transform">
            <CannabisLeafIcon className="w-6 h-6 text-[#25a86a]" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-black tracking-tight font-heading text-[#122e24] leading-tight">
              Herbal <span className="text-[#25a86a]">Harbour</span>
            </span>
          </div>
        </a>

        {/* Primary Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-[13px] font-bold text-slate-700">
          <a
            href="#home"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="text-[#143329] hover:text-[#25a86a] transition-colors whitespace-nowrap"
          >
            Home
          </a>
          <a
            href="#shop"
            onClick={(e) => { e.preventDefault(); onSelectCategory('all'); document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="hover:text-[#25a86a] transition-colors whitespace-nowrap"
          >
            All Products
          </a>
          <a
            href="#flower"
            onClick={(e) => { e.preventDefault(); onSelectCategory('flower'); document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="hover:text-[#25a86a] transition-colors whitespace-nowrap"
          >
            Craft Flower
          </a>
          <a
            href="#seeds"
            onClick={(e) => { e.preventDefault(); onSelectCategory('seeds'); document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="hover:text-[#25a86a] transition-colors whitespace-nowrap"
          >
            Seeds
          </a>
          <a
            href="#tinctures"
            onClick={(e) => { e.preventDefault(); onSelectCategory('tinctures'); document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="hover:text-[#25a86a] transition-colors whitespace-nowrap"
          >
            CBD Oils
          </a>

          {/* Google Sheets Inventory Link button */}
          <button
            onClick={onOpenGoogleSheet}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border ${
              isUsingGoogleSheet
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
            }`}
            title="Link Google Sheet containing items and prices"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isUsingGoogleSheet ? 'Google Sheet Synced' : 'Link Google Sheet'}</span>
          </button>

          {/* Spin & Win dedicated nav button */}
          <button
            onClick={onOpenJackpot}
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-sm hover:scale-105 transition-all cursor-pointer"
            title="Play Spin & Win Slot Machine"
          >
            <span>🎰 Spin & Win</span>
            <span className="bg-slate-950 text-amber-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold">3 Free</span>
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          
          {/* Search Bar */}
          <div className="relative hidden md:block w-44 lg:w-56">
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-[#f4f6f4] border border-slate-200 focus:border-[#25a86a] rounded-full py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="md:hidden p-2 rounded-full text-slate-600 hover:text-slate-900"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Wallet & Google Pay trigger */}
          <button
            onClick={onOpenWallet}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
            title="Google Login & Wallet"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-700" />
            <span className="font-mono tabular-nums text-emerald-800">R {user.walletBalance.toFixed(0)}</span>
          </button>

          {/* Admin link for joachimgrobbelaar@gmail.com */}
          {user.email.toLowerCase() === 'joachimgrobbelaar@gmail.com' && onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-emerald-900 text-emerald-200 hover:text-white text-[11px] font-bold border border-emerald-700 transition-colors cursor-pointer"
              title="Dispensary Admin Desk"
            >
              <span>Admin Desk</span>
            </button>
          )}

          {/* Strain Compare (Scale) */}
          <button
            onClick={onOpenCompare}
            className="relative p-2 rounded-full text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Compare Strains"
          >
            <Scale className="w-4 h-4" />
            {comparedProducts.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#25a86a] text-white text-[10px] font-bold flex items-center justify-center">
                {comparedProducts.length}
              </span>
            )}
          </button>

          {/* Wishlist */}
          <button
            onClick={onOpenWishlist}
            className="relative p-2 rounded-full text-slate-600 hover:bg-amber-50 hover:text-amber-600 transition-colors cursor-pointer"
            title="Saved Items"
          >
            <Heart className={`w-4 h-4 ${wishlist.length > 0 ? 'fill-amber-500 text-amber-500' : ''}`} />
            {wishlist.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Shopping Bag (Cart) */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center justify-center w-10 h-10 rounded-full bg-[#e5a83b] hover:bg-[#d89625] text-white shadow-sm transition-all cursor-pointer active:scale-95"
            title="View Cart"
          >
            <ShoppingBag className="w-4 h-4 text-white" />
            {totalCartCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#143329] text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-white">
                {totalCartCount}
              </span>
            )}
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile search bar */}
      {searchOpen && (
        <div className="md:hidden px-4 pb-3 pt-1 border-t border-slate-100 bg-white">
          <div className="relative">
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-[#f4f6f4] border border-slate-200 rounded-full py-2 pl-9 pr-3 text-xs text-slate-800 outline-none"
              autoFocus
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-slate-200 px-6 py-4 flex flex-col gap-3 text-sm font-semibold shadow-xl">
          <a
            href="#shop"
            onClick={() => { setMobileMenuOpen(false); onSelectCategory('all'); }}
            className="py-1 text-slate-800 hover:text-emerald-700"
          >
            All Products
          </a>
          <a
            href="#flower"
            onClick={() => { setMobileMenuOpen(false); onSelectCategory('flower'); }}
            className="py-1 text-slate-800 hover:text-emerald-700"
          >
            Craft Flower
          </a>
          <a
            href="#seeds"
            onClick={() => { setMobileMenuOpen(false); onSelectCategory('seeds'); }}
            className="py-1 text-slate-800 hover:text-emerald-700"
          >
            Seeds
          </a>
          <a
            href="#tinctures"
            onClick={() => { setMobileMenuOpen(false); onSelectCategory('tinctures'); }}
            className="py-1 text-slate-800 hover:text-emerald-700"
          >
            CBD Oils
          </a>
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenJackpot(); }}
              className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow-sm"
            >
              <span className="flex items-center gap-1.5">
                <span>🎰</span>
                <span>Spin & Win Reel</span>
              </span>
              <span className="bg-slate-950 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                3 Free Spins
              </span>
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenGoogleSheet(); }}
              className="flex items-center gap-2 text-xs text-emerald-800 font-bold py-1"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Link Google Sheet</span>
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenWallet(); }}
              className="flex items-center gap-2 text-xs text-slate-800 font-bold py-1"
            >
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span>Wallet: R {user.walletBalance.toFixed(0)} (Top up)</span>
            </button>
            <a
              href="https://wa.me/27824591234"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-[#25D366] font-bold py-1"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Direct Support</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
