import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, getFirebaseAuth, isFirebaseConfigured } from '../lib/firebase';

interface AuthContextValue {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  firebaseReady: boolean;
  walletBalance: number;
  setWalletBalance: (amount: number) => void;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (name: string, email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const WALLET_KEY = 'herbal_harbour_wallet_balance';

function readWallet(): number {
  try {
    const direct = localStorage.getItem(WALLET_KEY);
    if (direct != null) return Math.max(0, Number(direct) || 0);
    const legacy = localStorage.getItem('herbal_harbour_user_profile');
    if (legacy) {
      const parsed = JSON.parse(legacy) as { walletBalance?: number };
      return Math.max(0, Number(parsed.walletBalance) || 0);
    }
  } catch {
    /* ignore broken local storage */
  }
  return 0;
}

export function friendlyAuthError(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code: string }).code) : '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with that email already exists. Sign in instead.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/weak-password':
      return 'Use a password of at least 6 characters.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email or password is incorrect.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was closed before it finished.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorised for Google sign-in. Add it under Firebase Authentication → Settings → Authorised domains.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment and try again.';
    default:
      return error instanceof Error ? error.message : 'Something went wrong. Try again.';
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const firebaseReady = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(firebaseReady);
  const [walletBalance, setWalletBalanceState] = useState(readWallet);

  useEffect(() => {
    localStorage.setItem(WALLET_KEY, String(walletBalance));
  }, [walletBalance]);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, (next) => {
      setUser(next);
      if (!next) {
        setIsAdmin(false);
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    let cancelled = false;
    let roleAdmin = false;
    let claimAdmin = false;

    const publish = () => {
      if (!cancelled) {
        setIsAdmin(roleAdmin || claimAdmin);
        setLoading(false);
      }
    };

    user.getIdTokenResult().then((token) => {
      claimAdmin = token.claims.admin === true;
      publish();
    }).catch(() => publish());

    const unsubscribe = onSnapshot(doc(db, 'roles', user.uid), (snap) => {
      roleAdmin = snap.exists() && snap.data()?.admin === true;
      publish();
    }, () => {
      roleAdmin = false;
      publish();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [user]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAdmin,
    loading,
    firebaseReady,
    walletBalance,
    setWalletBalance: (amount: number) => setWalletBalanceState(Math.max(0, amount)),
    async signInEmail(email: string, password: string) {
      await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
    },
    async signUpEmail(name: string, email: string, password: string) {
      const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
    },
    async signInGoogle() {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(getFirebaseAuth(), provider);
    },
    async signOutUser() {
      await signOut(getFirebaseAuth());
    },
    async resetPassword(email: string) {
      await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
    },
  }), [user, isAdmin, loading, firebaseReady, walletBalance]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
