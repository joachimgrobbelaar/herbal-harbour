import React, { useState } from 'react';
import { Search, Heart, ShoppingBag, Menu, X, ChevronDown, UserRound, Wallet } from 'lucide-react';
import { CartItem, Product } from '../types';
import { CannabisLeafIcon } from './CannabisLeafIcon';
import { UserProfile } from '../types';

interface HeaderProps {
  cartItems: CartItem[];
  wishlist: string[];
  comparedProducts: Product[];
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenCompare: () => void;
  onOpenJackpot: () => void;
  onOpenGoogleSheet: () => void;
  onOpenAccount?: () => void;
  onOpenAuth?: () => void;
  onOpenAdmin?: () => void;
  isAdmin?: boolean;
  onOpen3DStudio?: () => void;
  user: UserProfile;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectCategory: (cat: string) => void;
  isUsingGoogleSheet: boolean;
  /** Store-credit wallet balance in rand; null while unknown / signed out. */
  walletBalance?: number | null;
}

const SHOP_LINKS = [
  { id: 'all', label: 'All products' },
  { id: 'flower', label: 'Craft flower' },
  { id: 'seeds', label: 'Seeds' },
  { id: 'tinctures', label: 'CBD oils' },
  { id: 'edibles', label: 'Edibles' },
  { id: 'topicals', label: 'Topicals' },
];

export const Header: React.FC<HeaderProps> = ({
  cartItems,
  wishlist,
  onOpenCart,
  onOpenWishlist,
  onOpenJackpot,
  onOpenCompare,
  onOpenGoogleSheet,
  onOpenAccount,
  onOpenAuth,
  onOpenAdmin,
  isAdmin,
  onOpen3DStudio,
  user,
  searchQuery,
  onSearchChange,
  onSelectCategory,
  walletBalance = null,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<'shop' | 'pages' | null>(null);
  const count = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const shop = (id: string) => {
    onSelectCategory(id);
    document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
    setOpenMenu(null);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-forest-900/10">
      <div className="max-w-7xl mx-auto px-3 sm:px-8 h-[76px] flex items-center gap-2 sm:gap-3 lg:gap-6">
        <a
          href="#home"
          onClick={(event) => { event.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="flex items-center gap-2 shrink-0"
        >
          <CannabisLeafIcon className="w-8 h-8 text-forest-700" />
          <span className="text-lg sm:text-[1.45rem] font-extrabold tracking-tight text-forest-900 leading-none">
            Herbal <span className="text-forest-700">Harbour</span>
          </span>
        </a>

        <nav className="hidden lg:flex items-center gap-5 xl:gap-7 text-[15px] font-bold text-forest-900 whitespace-nowrap" aria-label="Primary">
          <a href="#home" onClick={(event) => { event.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-forest-700">Home</a>
          <div className="relative" onMouseEnter={() => setOpenMenu('shop')} onMouseLeave={() => setOpenMenu(null)}>
            <button className="inline-flex items-center gap-1" aria-expanded={openMenu === 'shop'}>Shop <ChevronDown className="w-3.5 h-3.5" /></button>
            {openMenu === 'shop' && (
              <div className="absolute top-full left-0 pt-3">
                <div className="bg-white rounded-2xl shadow-xl border border-forest-900/10 py-2 min-w-44">
                  {SHOP_LINKS.map((link) => (
                    <button key={link.id} onClick={() => shop(link.id)} className="block w-full text-left px-4 py-2 text-sm hover:bg-paper">
                      {link.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <a href="#news" onClick={(event) => { event.preventDefault(); document.getElementById('news')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-forest-700">News</a>
          <button onClick={onOpenJackpot} className="hover:text-forest-700">Spin & Win</button>
          <div className="relative" onMouseEnter={() => setOpenMenu('pages')} onMouseLeave={() => setOpenMenu(null)}>
            <button className="inline-flex items-center gap-1" aria-expanded={openMenu === 'pages'}>Pages <ChevronDown className="w-3.5 h-3.5" /></button>
            {openMenu === 'pages' && (
              <div className="absolute top-full left-0 pt-3">
                <div className="bg-white rounded-2xl shadow-xl border border-forest-900/10 py-2 min-w-48 text-sm">
                  <button onClick={() => { setOpenMenu(null); user.isSignedIn ? onOpenAccount?.() : onOpenAuth?.(); }} className="block w-full text-left px-4 py-2 hover:bg-paper">
                    {user.isSignedIn ? 'Your account' : 'Sign in'}
                  </button>
                  <button onClick={() => { setOpenMenu(null); onOpenCompare(); }} className="block w-full text-left px-4 py-2 hover:bg-paper">Compare</button>
                  <button onClick={() => { setOpenMenu(null); onOpenGoogleSheet(); }} className="block w-full text-left px-4 py-2 hover:bg-paper">Shop spreadsheet</button>
                  {onOpen3DStudio && (
                    <button onClick={() => { setOpenMenu(null); onOpen3DStudio(); }} className="block w-full text-left px-4 py-2 hover:bg-paper">3D studio</button>
                  )}
                  {isAdmin && onOpenAdmin && (
                    <button onClick={() => { setOpenMenu(null); onOpenAdmin(); }} className="block w-full text-left px-4 py-2 hover:bg-paper">Shop desk</button>
                  )}
                </div>
              </div>
            )}
          </div>
        </nav>

        <div className="hidden md:flex flex-1 max-w-xs ml-auto mr-1 lg:mr-2 items-center bg-paper rounded-full border border-forest-900/10 pl-4 pr-1 py-1">
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search..."
            aria-label="Search products"
            className="flex-1 bg-transparent text-sm outline-none text-forest-900 placeholder:text-forest-700/70"
          />
          <button
            onClick={() => document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-9 h-9 rounded-full bg-signal text-forest-900 grid place-items-center"
            aria-label="Search the shop"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 ml-auto md:ml-0">
          <button
            onClick={() => (user.isSignedIn ? onOpenAccount?.() : onOpenAuth?.())}
            className="relative inline-flex items-center gap-2 min-h-12 min-w-12 justify-center rounded-full sm:pl-1.5 sm:pr-4 text-forest-900 hover:bg-paper transition-colors"
            aria-label={user.isSignedIn ? `Your account${typeof walletBalance === 'number' ? `, wallet balance R ${walletBalance.toFixed(2)}` : ''}` : 'Sign in or register'}
          >
            <span className="w-10 h-10 rounded-full border-2 border-forest-900/15 grid place-items-center overflow-hidden shrink-0">
              {user.isSignedIn && user.avatar
                ? <img src={user.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                : <UserRound className="w-5 h-5" />}
            </span>
            <span className="hidden sm:flex lg:hidden xl:flex flex-col items-start leading-tight text-left">
              {user.isSignedIn ? (
                <>
                  <span className="text-[13px] font-bold max-w-[9rem] truncate">{user.name}</span>
                  <span className="inline-flex items-center gap-1 text-[13px] font-mono font-bold text-forest-700">
                    <Wallet className="w-3.5 h-3.5" />
                    {typeof walletBalance === 'number' ? `R ${walletBalance.toFixed(2)}` : 'R —'}
                  </span>
                </>
              ) : (
                <span className="text-sm font-bold whitespace-nowrap">Sign in / Register</span>
              )}
            </span>
          </button>
          <button onClick={onOpenWishlist} className="relative hidden lg:grid w-12 h-12 rounded-full bg-signal text-forest-900 place-items-center" aria-label="Wishlist">
            <Heart className={`w-5 h-5 ${wishlist.length ? 'fill-forest-900' : ''}`} />
            {wishlist.length > 0 && <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-forest-900 text-paper text-[10px] font-bold grid place-items-center">{wishlist.length}</span>}
          </button>
          <button onClick={onOpenCart} className="relative w-12 h-12 rounded-full bg-signal text-forest-900 grid place-items-center" aria-label={`Cart${count ? `, ${count} items` : ''}`}>
            <ShoppingBag className="w-5 h-5" />
            {count > 0 && <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-forest-900 text-paper text-[10px] font-bold grid place-items-center">{count}</span>}
          </button>
          <button className="lg:hidden w-12 h-12 grid place-items-center" onClick={() => setMobileOpen((open) => !open)} aria-label="Menu">
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-forest-900/10 bg-white px-5 py-4 flex flex-col gap-2 text-sm font-bold">
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search..."
            aria-label="Search products"
            className="mb-2 rounded-full bg-paper px-4 py-2 font-medium"
          />
          {SHOP_LINKS.map((link) => (
            <button key={link.id} onClick={() => shop(link.id)} className="text-left py-1">{link.label}</button>
          ))}
          <button onClick={() => { setMobileOpen(false); document.getElementById('news')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-left py-2">News</button>
          <button onClick={() => { setMobileOpen(false); onOpenJackpot(); }} className="text-left py-2">Spin & Win</button>
          <button onClick={() => { setMobileOpen(false); onOpenWishlist(); }} className="text-left py-2">Wishlist{wishlist.length ? ` (${wishlist.length})` : ''}</button>
          <button onClick={() => { setMobileOpen(false); user.isSignedIn ? onOpenAccount?.() : onOpenAuth?.(); }} className="text-left py-1">
            {user.isSignedIn
              ? `Your account${typeof walletBalance === 'number' ? ` · Wallet R ${walletBalance.toFixed(2)}` : ''}`
              : 'Sign in / Register'}
          </button>
          {isAdmin && onOpenAdmin && <button onClick={() => { setMobileOpen(false); onOpenAdmin(); }} className="text-left py-1">Shop desk</button>}
        </div>
      )}
    </header>
  );
};
