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
  MessageCircle,
  Box,
  User as UserProfileIcon
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
  onOpenAboutUs?: () => void;
  onOpenNews?: () => void;
  onOpen3DStudio?: () => void;
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
  onOpenAboutUs,
  onOpenNews,
  onOpen3DStudio,
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
      {/* Top Notification Announcement Bar - herbalhub.co.za + Automated Charity Stream */}
      <div className="bg-gradient-to-r from-[#0d261c] via-[#122e24] to-[#1c0818] text-white text-[12px] py-1.5 px-4 sm:px-8 border-b border-emerald-950/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-emerald-200 truncate font-medium">
            <Truck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">
              <strong>Reconnect with Earth’s Bounty</strong> • Discreet Doorstep Delivery Nationwide • <span className="text-pink-300 font-bold">5% Automatically Aides SA Charities</span>
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
              <span className="hidden sm:inline">WhatsApp:</span>
              <span className="font-mono">+27 82 459 1234</span>
            </a>

            <span className="text-emerald-500/50">|</span>

            {/* Lucky 3D Slot Reel Link */}
            <button
              onClick={onOpenJackpot}
              className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 hover:scale-105 text-white font-black text-[11px] transition-all shadow-[0_0_12px_rgba(255,0,85,0.4)] cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>🎰 3D Slot (3 Free Spins)</span>
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
        <nav className="hidden lg:flex items-center gap-5 text-[13px] font-bold text-slate-700">
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
            href="#psilocybin"
            onClick={(e) => { e.preventDefault(); onSelectCategory('psilocybin'); document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="hover:text-pink-600 text-pink-700 transition-colors whitespace-nowrap flex items-center gap-1"
          >
            <span>🍄 Sacred Mycology</span>
          </a>
          <a
            href="#flower"
            onClick={(e) => { e.preventDefault(); onSelectCategory('flower'); document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="hover:text-[#25a86a] transition-colors whitespace-nowrap"
          >
            Craft Flower
          </a>
          <a
            href="#news"
            onClick={(e) => { 
              e.preventDefault(); 
              if (onOpenNews) onOpenNews();
              else document.getElementById('news-section')?.scrollIntoView({ behavior: 'smooth' }); 
            }}
            className="hover:text-[#25a86a] transition-colors whitespace-nowrap"
          >
            News & Legislation
          </a>
          {onOpenAboutUs && (
            <button
              onClick={onOpenAboutUs}
              className="hover:text-[#25a86a] text-slate-700 font-bold transition-colors whitespace-nowrap cursor-pointer"
            >
              About Us
            </button>
          )}

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
            <span>{isUsingGoogleSheet ? 'Google Sheet Synced' : 'Link Sheet'}</span>
          </button>

          {/* 3D Slot Machine dedicated Red Light District neon button */}
          <button
            onClick={onOpenJackpot}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 hover:scale-105 text-white font-black text-xs shadow-[0_0_15px_rgba(255,0,85,0.4)] transition-all cursor-pointer"
            title="Play 3D Slot Machine"
          >
            <span>🎰 3D Mechanical Slots</span>
            <span className="bg-slate-950 text-amber-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold">3 Free</span>
          </button>

          {/* 3D Studio & OBJ button */}
          {onOpen3DStudio && (
            <button
              onClick={onOpen3DStudio}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 text-xs font-bold transition-all cursor-pointer border border-slate-200"
              title="Open 3D Dispensary Studio & OBJ Animator"
            >
              <Box className="w-3.5 h-3.5 text-emerald-600" />
              <span>3D Models</span>
            </button>
          )}
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

          {/* Wallet Balance Badge */}
          <button
            onClick={onOpenWallet}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer border border-slate-200/60"
            title="Herbal Harbour Patient Wallet"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-700" />
            <span className="font-mono tabular-nums text-emerald-800">R {user.walletBalance.toFixed(0)}</span>
          </button>

          {/* User Profile Icon Button (Google OAuth / Email Auth) */}
          <button
            onClick={onOpenWallet}
            className="relative flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-full hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200/80 active:scale-95"
            title={user.isSignedIn ? `Logged in as ${user.name}` : 'Sign In / Register Account'}
            aria-label="User Profile & Authentication"
          >
            {user.isSignedIn && user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-600"
              />
            ) : (
              <UserProfileIcon className="w-5 h-5 text-slate-700" />
            )}
            {user.isSignedIn && (
              <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
            )}
          </button>

          {/* Admin link */}
          {onOpenAdmin && (
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
            className="relative flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-full text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Compare Strains"
            aria-label="Compare Strains"
          >
            <Scale className="w-5 h-5" />
            {comparedProducts.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#25a86a] text-white text-[10px] font-bold flex items-center justify-center">
                {comparedProducts.length}
              </span>
            )}
          </button>

          {/* Wishlist - Expanded 44x44 CSS Hit Area */}
          <button
            onClick={onOpenWishlist}
            className="relative flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-full text-slate-600 hover:bg-amber-50 hover:text-amber-600 transition-colors cursor-pointer"
            title="Saved Items"
            aria-label="Wishlist"
          >
            <Heart className={`w-5 h-5 ${wishlist.length > 0 ? 'fill-amber-500 text-amber-500' : ''}`} />
            {wishlist.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Shopping Bag (Cart) - Expanded 44x44 Solid High-Contrast Button */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[#143329] hover:bg-[#1a4437] text-white shadow-md transition-all cursor-pointer active:scale-95"
            title="View Cart"
            aria-label="Cart"
          >
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            {totalCartCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full bg-[#25a86a] text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-xs">
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
            href="#psilocybin"
            onClick={() => { setMobileMenuOpen(false); onSelectCategory('psilocybin'); }}
            className="py-1 text-pink-700 font-bold hover:text-pink-600 flex items-center gap-1"
          >
            <span>🍄 Sacred Mycology (Psilocybin)</span>
          </a>
          <a
            href="#flower"
            onClick={() => { setMobileMenuOpen(false); onSelectCategory('flower'); }}
            className="py-1 text-slate-800 hover:text-emerald-700"
          >
            Craft Flower
          </a>
          <a
            href="#news"
            onClick={() => { 
              setMobileMenuOpen(false); 
              if (onOpenNews) onOpenNews();
              else document.getElementById('news-section')?.scrollIntoView({ behavior: 'smooth' }); 
            }}
            className="py-1 text-slate-800 hover:text-emerald-700"
          >
            News & Legislation
          </a>
          {onOpenAboutUs && (
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenAboutUs(); }}
              className="py-1 text-left text-slate-800 hover:text-emerald-700 font-semibold"
            >
              About Our Story & Founders
            </button>
          )}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenJackpot(); }}
              className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 text-white font-black text-xs shadow-[0_0_15px_rgba(255,0,85,0.4)]"
            >
              <span className="flex items-center gap-1.5">
                <span>🎰</span>
                <span>3D Mechanical Slots</span>
              </span>
              <span className="bg-slate-950 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                Win R500
              </span>
            </button>
            {onOpen3DStudio && (
              <button
                onClick={() => { setMobileMenuOpen(false); onOpen3DStudio(); }}
                className="flex items-center gap-2 text-xs text-slate-800 font-bold py-1"
              >
                <Box className="w-4 h-4 text-emerald-600" />
                <span>3D Studio & .OBJ Animator</span>
              </button>
            )}
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
