import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ProductCatalog } from './components/ProductCatalog';
import { StorySection } from './components/StorySection';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { ComparisonModal } from './components/ComparisonModal';
import { WishlistModal } from './components/WishlistModal';
import { JackpotSpinModal } from './components/JackpotSpinModal';
import { AgeVerificationModal } from './components/AgeVerificationModal';
import { GoogleSheetModal } from './components/GoogleSheetModal';
import { WalletModal, UserProfile } from './components/WalletModal';
import { WhatsAppButton } from './components/WhatsAppButton';
import { Footer } from './components/Footer';
import { AdminPage } from './pages/AdminPage';
import { ThreeStudioModal } from './components/ThreeStudioModal';
import { PRODUCTS as DEFAULT_PRODUCTS } from './data/products';
import { Product, CartItem, Coupon, OrderDetails } from './types';
import { Check, Scale, FileSpreadsheet } from 'lucide-react';

export default function App() {
  // Products list (Default or Google Sheet synced)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const savedGSheetProds = localStorage.getItem('herbal_harbour_gsheet_products');
      if (savedGSheetProds) {
        const parsed = JSON.parse(savedGSheetProds);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_PRODUCTS;
  });

  const [activeSheetUrl, setActiveSheetUrl] = useState<string>(() => {
    return localStorage.getItem('herbal_harbour_sheet_url') || '';
  });

  const isUsingGoogleSheet = Boolean(activeSheetUrl && products !== DEFAULT_PRODUCTS);

  // User Profile & Wallet State
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const savedUser = localStorage.getItem('herbal_harbour_user_profile');
      if (savedUser) return JSON.parse(savedUser);
    } catch (e) {
      console.error(e);
    }
    return {
      name: 'Marnu Grobbelaar',
      email: 'joachimgrobbelaar@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      walletBalance: 250,
      isSignedIn: true
    };
  });

  // Cart state with localStorage
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('herbal_harbour_cart');
      return saved ? JSON.parse(saved) : [
        { product: DEFAULT_PRODUCTS[0], quantity: 1, selectedWeight: '5 Grams' }
      ];
    } catch {
      return [];
    }
  });

  // Wishlist state with localStorage
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('herbal_harbour_wishlist');
      return saved ? JSON.parse(saved) : ['prod-tangerine-dream'];
    } catch {
      return ['prod-tangerine-dream'];
    }
  });

  // Comparison tray state
  const [comparedProducts, setComparedProducts] = useState<Product[]>([]);

  // Active coupon state
  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(() => {
    try {
      const saved = localStorage.getItem('herbal_harbour_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Catalog search & filtering state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isJackpotOpen, setIsJackpotOpen] = useState(false);
  const [isGoogleSheetOpen, setIsGoogleSheetOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [is3DStudioOpen, setIs3DStudioOpen] = useState(false);
  const [selectedProductForDetails, setSelectedProductForDetails] = useState<Product | null>(null);

  // Admin page route (/admin or #admin)
  const [isAdminView, setIsAdminView] = useState(() => {
    return typeof window !== 'undefined' && (window.location.pathname === '/admin' || window.location.hash === '#admin');
  });

  useEffect(() => {
    const handleLocationChange = () => {
      setIsAdminView(window.location.pathname === '/admin' || window.location.hash === '#admin');
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const openAdmin = () => {
    setIsAdminView(true);
    try {
      window.history.pushState({}, '', '/admin');
    } catch {
      window.location.hash = '#admin';
    }
  };

  const closeAdmin = () => {
    setIsAdminView(false);
    try {
      window.history.pushState({}, '', '/');
    } catch {
      window.location.hash = '';
    }
  };

  // Toast alert state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync states to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('herbal_harbour_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error(e);
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem('herbal_harbour_wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.error(e);
    }
  }, [wishlist]);

  useEffect(() => {
    try {
      if (activeCoupon) {
        localStorage.setItem('herbal_harbour_coupon', JSON.stringify(activeCoupon));
      } else {
        localStorage.removeItem('herbal_harbour_coupon');
      }
    } catch (e) {
      console.error(e);
    }
  }, [activeCoupon]);

  useEffect(() => {
    try {
      localStorage.setItem('herbal_harbour_user_profile', JSON.stringify(userProfile));
    } catch (e) {
      console.error(e);
    }
  }, [userProfile]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Google Sheet Sync Handler
  const handleSyncGoogleSheet = (newProducts: Product[], sheetId: string, sheetUrl: string) => {
    setProducts(newProducts);
    setActiveSheetUrl(sheetUrl);
    localStorage.setItem('herbal_harbour_gsheet_products', JSON.stringify(newProducts));
    localStorage.setItem('herbal_harbour_sheet_url', sheetUrl);
    showToast(`Synced ${newProducts.length} items from Google Sheets`);
  };

  const handleResetToDefaultProducts = () => {
    setProducts(DEFAULT_PRODUCTS);
    setActiveSheetUrl('');
    localStorage.removeItem('herbal_harbour_gsheet_products');
    localStorage.removeItem('herbal_harbour_sheet_url');
    showToast('Reverted to default dispensary catalog');
  };

  // Google Sign-In & Wallet Operations
  const handleGoogleSignIn = () => {
    setUserProfile({
      name: 'Marnu Grobbelaar',
      email: 'joachimgrobbelaar@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      walletBalance: 250,
      isSignedIn: true
    });
    showToast('Signed in with Google (joachimgrobbelaar@gmail.com)');
  };

  const handleSignOut = () => {
    setUserProfile((prev) => ({
      ...prev,
      isSignedIn: false
    }));
    showToast('Signed out of Google account');
  };

  const handleTopUpWallet = (amount: number) => {
    setUserProfile((prev) => ({
      ...prev,
      walletBalance: prev.walletBalance + amount
    }));
    showToast(`Google Pay: Added R ${amount.toFixed(2)} to wallet!`);
  };

  // Cart operations
  const handleAddToCart = (product: Product, quantity: number = 1, weight?: string) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex].quantity += quantity;
        if (weight) next[existingIndex].selectedWeight = weight;
        return next;
      } else {
        return [...prev, { product, quantity, selectedWeight: weight || 'Standard' }];
      }
    });
    showToast(`Added ${product.name} to cart`);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Wishlist toggle
  const handleToggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      if (prev.includes(productId)) {
        showToast('Removed from saved items');
        return prev.filter((id) => id !== productId);
      } else {
        showToast('Saved to wishlist');
        return [...prev, productId];
      }
    });
  };

  // Strain comparison toggle
  const handleToggleCompare = (product: Product) => {
    setComparedProducts((prev) => {
      if (prev.some((p) => p.id === product.id)) {
        showToast(`Removed ${product.name} from compare`);
        return prev.filter((p) => p.id !== product.id);
      } else {
        if (prev.length >= 3) {
          showToast('Comparison limit reached (max 3 strains)');
          return prev;
        }
        showToast(`Added ${product.name} to strain compare`);
        return [...prev, product];
      }
    });
  };

  const handleRemoveCompared = (productId: string) => {
    setComparedProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  // Coupons
  const handleApplyCoupon = (coupon: Coupon) => {
    setActiveCoupon(coupon);
    showToast(`Coupon ${coupon.code} applied!`);
  };

  const handleApplyCouponCode = (code: string): boolean => {
    const validCoupons: Record<string, { percent: number; desc: string }> = {
      'HARBOUR5': { percent: 5, desc: '5% OFF Storewide' },
      'HARBOUR10': { percent: 10, desc: '10% OFF Storewide' },
      'GREEN10': { percent: 10, desc: '10% OFF Green Apple Win' },
      'ORANGE15': { percent: 15, desc: '15% OFF Citrus Win' },
      'GREENHERB15': { percent: 15, desc: '15% OFF Storewide' },
      'CITRUS20': { percent: 20, desc: '20% OFF Orders over R500' },
      'FREESHIP': { percent: 100, desc: 'FREE Nationwide Courier' },
      'JACKPOT25': { percent: 25, desc: '⭐ 25% RARE JACKPOT WINNER ⭐' },
      'VIPHARBOUR': { percent: 15, desc: '15% VIP Dispatch Club Discount' }
    };

    const match = validCoupons[code];
    if (match) {
      const coupon: Coupon = {
        code,
        discountPercent: match.percent,
        description: match.desc,
        minSpend: code === 'HARBOUR5' ? 800 : code === 'CITRUS20' ? 500 : undefined
      };
      setActiveCoupon(coupon);
      showToast(`Promo Code ${code} applied successfully!`);
      return true;
    }
    return false;
  };

  const handleRemoveCoupon = () => {
    setActiveCoupon(null);
    showToast('Coupon removed');
  };

  const handleOrderSuccess = (order: OrderDetails) => {
    // Deduct wallet if paid with wallet
    if (order.paymentMethod.includes('WALLET')) {
      setUserProfile((prev) => ({
        ...prev,
        walletBalance: Math.max(0, prev.walletBalance - order.total)
      }));
    }
    setCartItems([]);
    setActiveCoupon(null);
    showToast(`Order ${order.orderNumber} confirmed! Dispatching soon.`);
  };

  if (isAdminView) {
    return (
      <AdminPage
        onBackToStore={closeAdmin}
        currentUserEmail={userProfile.email}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf8] text-slate-800">
      
      {/* 18+ South Africa Compliance Modal */}
      <AgeVerificationModal />

      {/* Header with authentic 7-point Cannabis Leaf icon */}
      <Header
        cartItems={cartItems}
        wishlist={wishlist}
        comparedProducts={comparedProducts}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenCompare={() => setIsCompareOpen(true)}
        onOpenJackpot={() => setIsJackpotOpen(true)}
        onOpenGoogleSheet={() => setIsGoogleSheetOpen(true)}
        onOpenWallet={() => setIsWalletOpen(true)}
        onOpenAdmin={openAdmin}
        onOpen3DStudio={() => setIs3DStudioOpen(true)}
        user={userProfile}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectCategory={(cat) => setSelectedCategory(cat)}
        isUsingGoogleSheet={isUsingGoogleSheet}
      />

      {/* Hero Section */}
      <main className="flex-1">
        <Hero
          onExploreProducts={() => {
            setSelectedCategory('all');
            document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          onSelectProductForDetails={(p) => setSelectedProductForDetails(p)}
          onAddToCart={handleAddToCart}
          onOpenGoogleSheet={() => setIsGoogleSheetOpen(true)}
          onOpenJackpot={() => setIsJackpotOpen(true)}
          onOpen3DStudio={() => setIs3DStudioOpen(true)}
          allProducts={products}
        />

        {/* Live Google Sheet banner indicator if connected */}
        {isUsingGoogleSheet && (
          <div className="bg-emerald-900 text-white text-xs py-2 px-4 sm:px-8 border-b border-emerald-950 flex items-center justify-between">
            <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                Live inventory linked from Google Sheet ({products.length} items active)
              </span>
              <button
                onClick={() => setIsGoogleSheetOpen(true)}
                className="underline font-bold text-emerald-300 hover:text-white cursor-pointer"
              >
                Manage Sheet Link
              </button>
            </div>
          </div>
        )}

        {/* Product Catalog */}
        <ProductCatalog
          products={products}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchQuery={searchQuery}
          wishlist={wishlist}
          comparedProducts={comparedProducts}
          onToggleWishlist={handleToggleWishlist}
          onToggleCompare={handleToggleCompare}
          onAddToCart={handleAddToCart}
          onOpenDetails={(p) => setSelectedProductForDetails(p)}
          onOpenJackpot={() => setIsJackpotOpen(true)}
        />

        {/* Story Section */}
        <StorySection />
      </main>

      {/* Persistent Floating Spin & Win Quick Launcher */}
      <button
        onClick={() => setIsJackpotOpen(true)}
        className="fixed bottom-24 right-6 z-40 group flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 text-slate-950 font-black text-xs shadow-2xl border-2 border-amber-200 hover:scale-105 active:scale-95 transition-all cursor-pointer animate-pulse hover:animate-none"
        title="Spin the slot machine and win up to R500 wallet credit!"
      >
        <span className="text-base">🎰</span>
        <div className="flex flex-col text-left leading-none">
          <span className="font-black tracking-tight text-[11px] uppercase">Spin & Win</span>
          <span className="text-[9px] font-bold text-amber-950 font-mono">Win up to R500</span>
        </div>
        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-950 text-amber-300 text-[10px] font-bold">
          3 Free
        </span>
      </button>

      {/* Floating Direct WhatsApp Order Button */}
      <WhatsAppButton phoneNumber="27824591234" />

      {/* Footer */}
      <Footer onOpenAdmin={openAdmin} />

      {/* Modals & Overlays */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        activeCoupon={activeCoupon}
        onApplyCouponCode={handleApplyCouponCode}
        onRemoveCoupon={handleRemoveCoupon}
        onOpenJackpot={() => setIsJackpotOpen(true)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        activeCoupon={activeCoupon}
        onOrderSuccess={handleOrderSuccess}
        userWalletBalance={userProfile.walletBalance}
        onOpenWallet={() => setIsWalletOpen(true)}
      />

      <ProductDetailModal
        product={selectedProductForDetails}
        onClose={() => setSelectedProductForDetails(null)}
        onAddToCart={handleAddToCart}
        isWishlisted={selectedProductForDetails ? wishlist.includes(selectedProductForDetails.id) : false}
        isCompared={selectedProductForDetails ? comparedProducts.some((p) => p.id === selectedProductForDetails.id) : false}
        onToggleWishlist={handleToggleWishlist}
        onToggleCompare={handleToggleCompare}
      />

      <ComparisonModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        products={comparedProducts}
        onRemoveProduct={handleRemoveCompared}
        onAddToCart={handleAddToCart}
      />

      <WishlistModal
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlistIds={wishlist}
        allProducts={products}
        onRemoveFromWishlist={handleToggleWishlist}
        onAddToCart={handleAddToCart}
        onOpenDetails={(p) => setSelectedProductForDetails(p)}
      />

      {/* Unfair Casino Spin & Win Modal */}
      <JackpotSpinModal
        isOpen={isJackpotOpen}
        onClose={() => setIsJackpotOpen(false)}
        user={userProfile}
        onUpdateWallet={(newBalance) => {
          setUserProfile((prev) => ({
            ...prev,
            walletBalance: newBalance
          }));
        }}
        onOpenWallet={() => setIsWalletOpen(true)}
      />

      {/* Google Sheet Live Inventory Modal */}
      <GoogleSheetModal
        isOpen={isGoogleSheetOpen}
        onClose={() => setIsGoogleSheetOpen(false)}
        onSyncProducts={handleSyncGoogleSheet}
        onResetToDefault={handleResetToDefaultProducts}
        activeSheetUrl={activeSheetUrl}
        isUsingGoogleSheet={isUsingGoogleSheet}
        itemCount={products.length}
      />

      {/* Google Login & Google Pay Wallet Modal */}
      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        user={userProfile}
        onGoogleSignIn={handleGoogleSignIn}
        onSignOut={handleSignOut}
        onTopUpWallet={handleTopUpWallet}
      />

      {/* 3D Studio & OBJ Animator Modal */}
      <ThreeStudioModal
        isOpen={is3DStudioOpen}
        onClose={() => setIs3DStudioOpen(false)}
      />

      {/* Floating Bottom Quick Action Tray (Compare) */}
      {comparedProducts.length > 0 && (
        <div className="fixed bottom-6 left-6 z-30 bg-[#143329] text-white px-4 py-2.5 rounded-full shadow-xl border border-emerald-500/40 flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-amber-400" />
            <span>Comparing <strong>{comparedProducts.length}</strong></span>
          </div>
          <button
            onClick={() => setIsCompareOpen(true)}
            className="px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-colors cursor-pointer text-[11px]"
          >
            View
          </button>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#122e24] text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-2.5 text-xs font-semibold animate-slide-up">
          <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
