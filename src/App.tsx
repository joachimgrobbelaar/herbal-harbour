import React, { useEffect, useState } from 'react';
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
import { AccountPage } from './pages/AccountPage';
import { AuthModal } from './components/AuthModal';
import { ThreeStudioModal } from './components/ThreeStudioModal';
import { useAuth } from './context/AuthContext';
import { useShop } from './context/ShopContext';
import { couponFromCode, quoteCart } from './lib/pricing';
import { checkoutToSale, placeSale } from './services/orders';
import { Product, Coupon, CheckoutDetails } from './types';
import { Check, Scale, ShoppingBag } from 'lucide-react';

type View = 'store' | 'admin' | 'account';

function readView(): View {
  if (typeof window === 'undefined') return 'store';
  const path = window.location.pathname;
  if (path === '/admin' || window.location.hash === '#admin') return 'admin';
  if (path === '/account' || window.location.hash === '#account') return 'account';
  return 'store';
}

export default function App() {
  const { user, isAdmin, loading: authLoading, walletBalance, setWalletBalance, signInGoogle, signOutUser, firebaseReady } = useAuth();
  const { products, catalogSource, cartItems, addToCart, updateQuantity, removeFromCart, clearCart } = useShop();

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('herbal_harbour_wishlist');
      return saved ? JSON.parse(saved) : ['prod-tangerine-dream'];
    } catch {
      return ['prod-tangerine-dream'];
    }
  });
  const [comparedProducts, setComparedProducts] = useState<Product[]>([]);
  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(() => {
    try {
      const saved = localStorage.getItem('herbal_harbour_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isJackpotOpen, setIsJackpotOpen] = useState(false);
  const [isGoogleSheetOpen, setIsGoogleSheetOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [is3DStudioOpen, setIs3DStudioOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [selectedProductForDetails, setSelectedProductForDetails] = useState<Product | null>(null);
  const [view, setView] = useState<View>(readView);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setView(readView());
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('hashchange', sync);
    };
  }, []);

  const navigate = (next: View) => {
    const path = next === 'store' ? '/' : `/${next}`;
    setView(next);
    try {
      window.history.pushState({}, '', path);
    } catch {
      window.location.hash = next === 'store' ? '' : `#${next}`;
    }
  };

  useEffect(() => {
    localStorage.setItem('herbal_harbour_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    if (activeCoupon) localStorage.setItem('herbal_harbour_coupon', JSON.stringify(activeCoupon));
    else localStorage.removeItem('herbal_harbour_coupon');
  }, [activeCoupon]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => setToastMessage(null), 2800);
  };

  const userProfile: UserProfile = {
    name: user?.displayName || (user?.email ? user.email.split('@')[0] : 'Guest'),
    email: user?.email || '',
    avatar: user?.photoURL || '',
    walletBalance,
    isSignedIn: Boolean(user),
  };

  const handleAddToCart = (product: Product, quantity: number = 1, weight?: string) => {
    const result = addToCart(product, quantity, weight);
    showToast(result.message);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    const result = updateQuantity(productId, quantity);
    if (!result.ok) showToast(result.message);
  };

  const handleApplyCouponCode = (code: string): string | null => {
    const coupon = couponFromCode(code);
    if (!coupon) return 'Invalid promo code. Play the Lucky Reel to win active codes!';
    const { subtotal } = quoteCart(cartItems, null);
    if (coupon.minSpend && subtotal < coupon.minSpend) {
      return `${coupon.code} needs a spend of R ${coupon.minSpend.toFixed(2)}.`;
    }
    setActiveCoupon(coupon);
    showToast(`Promo code ${coupon.code} applied.`);
    return null;
  };

  const handlePlaceOrder = async (details: CheckoutDetails) => {
    if (!user) throw new Error('Sign in before placing an order.');
    if (catalogSource !== 'firestore') {
      throw new Error('Live stock is not loaded yet. Seed the catalogue before taking orders.');
    }
    const quote = quoteCart(cartItems, activeCoupon);
    const order = await placeSale(checkoutToSale(user.uid, cartItems, details, quote));
    clearCart();
    setActiveCoupon(null);
    showToast(`Order ${order.orderNumber} received. Payment is still due.`);
    return order;
  };

  const openCheckout = () => {
    if (!firebaseReady) {
      showToast('Connect Firebase before checkout. See the README.');
      return;
    }
    if (!user) {
      setIsCartOpen(false);
      setIsAuthOpen(true);
      showToast('Sign in to place an order.');
      return;
    }
    if (catalogSource !== 'firestore') {
      showToast('The live catalogue is not seeded yet, so checkout is closed.');
      return;
    }
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  if (view === 'admin') {
    if (authLoading) {
      return <div className="min-h-screen grid place-items-center text-sm text-slate-500">Checking access…</div>;
    }
    if (!user || !isAdmin) {
      return (
        <div className="min-h-screen bg-[#f7f8f7] grid place-items-center p-6">
          <div className="max-w-md bg-white border border-slate-200 rounded-3xl p-8 text-center">
            <h1 className="text-xl font-bold mb-2">Shop desk</h1>
            <p className="text-sm text-slate-600 mb-4">
              {user
                ? 'This account is not an admin yet. The owner grants access with the roles document described in the README.'
                : 'Sign in with the shop owner account to open the desk.'}
            </p>
            {!user && (
              <button onClick={() => setIsAuthOpen(true)} className="px-4 py-2 rounded-full bg-[#1e8755] text-white text-xs font-bold">
                Sign in
              </button>
            )}
            <button onClick={() => navigate('store')} className="block mx-auto mt-3 text-xs text-emerald-800 font-bold">
              Back to the shop
            </button>
            <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onSuccess={showToast} />
          </div>
        </div>
      );
    }
    return <AdminPage onBackToStore={() => navigate('store')} onNotify={showToast} />;
  }

  if (view === 'account') {
    return (
      <>
        <AccountPage onBack={() => navigate('store')} onSignIn={() => setIsAuthOpen(true)} onNotify={showToast} />
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onSuccess={showToast} />
        {toastMessage && <Toast message={toastMessage} />}
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper text-forest-900">
      <AgeVerificationModal />
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
        onOpenAccount={() => navigate('account')}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAdmin={() => navigate('admin')}
        isAdmin={isAdmin}
        onOpen3DStudio={() => setIs3DStudioOpen(true)}
        user={userProfile}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectCategory={setSelectedCategory}
        isUsingGoogleSheet={false}
      />

      <main className="flex-1">
        <Hero
          onExploreProducts={() => {
            setSelectedCategory('all');
            document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          onSelectProductForDetails={(product) => setSelectedProductForDetails(product)}
          onAddToCart={handleAddToCart}
          onOpenGoogleSheet={() => setIsGoogleSheetOpen(true)}
          onOpenJackpot={() => setIsJackpotOpen(true)}
          onOpen3DStudio={() => setIs3DStudioOpen(true)}
          allProducts={products}
        />

        {catalogSource !== 'firestore' && (
          <div className="bg-amber-50 text-amber-950 text-xs py-2 px-4 border-b border-amber-200">
            <div className="max-w-7xl mx-auto">
              {catalogSource === 'offline'
                ? 'Firebase is not connected, so this is the sample catalogue. Add the VITE_FIREBASE_* keys to take live orders.'
                : 'Firestore is connected but the catalogue is empty. Run npm run seed, then refresh. Checkout stays closed until then.'}
            </div>
          </div>
        )}

        <ProductCatalog
          products={products}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchQuery={searchQuery}
          wishlist={wishlist}
          comparedProducts={comparedProducts}
          onToggleWishlist={(productId) => {
            setWishlist((prev) => prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]);
          }}
          onToggleCompare={(product) => {
            setComparedProducts((prev) => {
              if (prev.some((item) => item.id === product.id)) return prev.filter((item) => item.id !== product.id);
              if (prev.length >= 3) {
                showToast('Comparison limit reached (max 3 strains)');
                return prev;
              }
              return [...prev, product];
            });
          }}
          onAddToCart={handleAddToCart}
          onOpenDetails={(product) => setSelectedProductForDetails(product)}
          onOpenJackpot={() => setIsJackpotOpen(true)}
        />
        <StorySection />
      </main>

      <button
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-signal text-forest-900 shadow-xl grid place-items-center"
        aria-label="Open cart"
      >
        <ShoppingBag className="w-5 h-5" />
        {cartItems.length > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-forest-900 text-paper text-[10px] font-bold grid place-items-center">
            {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
          </span>
        )}
      </button>

      <WhatsAppButton phoneNumber="27824591234" />
      <Footer onOpenAdmin={isAdmin ? () => navigate('admin') : undefined} />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={removeFromCart}
        onProceedToCheckout={openCheckout}
        activeCoupon={activeCoupon}
        onApplyCouponCode={handleApplyCouponCode}
        onRemoveCoupon={() => { setActiveCoupon(null); showToast('Coupon removed'); }}
        onOpenJackpot={() => setIsJackpotOpen(true)}
      />
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        activeCoupon={activeCoupon}
        customerName={userProfile.name === 'Guest' ? '' : userProfile.name}
        customerEmail={userProfile.email}
        onPlaceOrder={handlePlaceOrder}
      />
      <ProductDetailModal
        product={selectedProductForDetails}
        onClose={() => setSelectedProductForDetails(null)}
        onAddToCart={handleAddToCart}
        isWishlisted={selectedProductForDetails ? wishlist.includes(selectedProductForDetails.id) : false}
        isCompared={selectedProductForDetails ? comparedProducts.some((product) => product.id === selectedProductForDetails.id) : false}
        onToggleWishlist={(productId) => setWishlist((prev) => prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId])}
        onToggleCompare={(product) => {
          setComparedProducts((prev) => {
            if (prev.some((item) => item.id === product.id)) return prev.filter((item) => item.id !== product.id);
            if (prev.length >= 3) {
              showToast('Comparison limit reached (max 3 strains)');
              return prev;
            }
            return [...prev, product];
          });
        }}
      />
      <ComparisonModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        products={comparedProducts}
        onRemoveProduct={(productId) => setComparedProducts((prev) => prev.filter((product) => product.id !== productId))}
        onAddToCart={handleAddToCart}
      />
      <WishlistModal
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlistIds={wishlist}
        allProducts={products}
        onRemoveFromWishlist={(productId) => setWishlist((prev) => prev.filter((id) => id !== productId))}
        onAddToCart={handleAddToCart}
        onOpenDetails={(product) => setSelectedProductForDetails(product)}
      />
      <JackpotSpinModal
        isOpen={isJackpotOpen}
        onClose={() => setIsJackpotOpen(false)}
        user={userProfile}
        onUpdateWallet={(next) => setWalletBalance(next)}
        onOpenWallet={() => setIsWalletOpen(true)}
      />
      <GoogleSheetModal
        isOpen={isGoogleSheetOpen}
        onClose={() => setIsGoogleSheetOpen(false)}
        isAdmin={isAdmin}
        onOpenAdmin={() => navigate('admin')}
      />
      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        user={userProfile}
        onGoogleSignIn={() => {
          signInGoogle().then(() => showToast('Signed in with Google.')).catch((error) => showToast(error instanceof Error ? error.message : 'Google sign-in failed.'));
        }}
        onSignOut={() => {
          signOutUser().then(() => showToast('Signed out.')).catch(() => showToast('Could not sign out.'));
        }}
        onTopUpWallet={(amount) => {
          setWalletBalance(walletBalance + amount);
          showToast(`Added R ${amount.toFixed(2)} of on-device Spin & Win credit.`);
        }}
      />
      <ThreeStudioModal isOpen={is3DStudioOpen} onClose={() => setIs3DStudioOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onSuccess={showToast} />

      {comparedProducts.length > 0 && (
        <div className="fixed bottom-24 left-6 z-30 bg-forest-900 text-paper px-4 py-2.5 rounded-full shadow-xl flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-amber-400" />
            <span>Comparing <strong>{comparedProducts.length}</strong></span>
          </div>
          <button onClick={() => setIsCompareOpen(true)} className="px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 font-bold text-[11px]">
            View
          </button>
        </div>
      )}
      {toastMessage && <Toast message={toastMessage} />}
    </div>
  );
}

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#122e24] text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-2.5 text-xs font-semibold">
      <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
        <Check className="w-3.5 h-3.5" />
      </div>
      <span>{message}</span>
    </div>
  );
}
