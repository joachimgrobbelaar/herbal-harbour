import React, { useEffect, useState } from 'react';
import { X, Mail, Lock, UserRound } from 'lucide-react';
import { friendlyAuthError, useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  /** Which tab to show when the modal opens (e.g. 'sign-up' from Spin & Win). */
  initialMode?: 'sign-in' | 'sign-up';
}

type Mode = 'sign-in' | 'sign-up' | 'reset';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess, initialMode = 'sign-in' }) => {
  const { firebaseReady, signInEmail, signUpEmail, signInGoogle, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>('sign-in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!firebaseReady) {
      setError('Firebase is not configured yet. Add the VITE_FIREBASE_* values and restart the app.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'reset') {
        await resetPassword(email);
        onSuccess?.(`Password reset email sent to ${email}`);
        onClose();
        return;
      }
      if (mode === 'sign-up') {
        await signUpEmail(name, email, password);
        onSuccess?.('Account created. You are signed in.');
      } else {
        await signInEmail(email, password);
        onSuccess?.('Signed in.');
      }
      onClose();
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError(null);
    if (!firebaseReady) {
      setError('Firebase is not configured yet. Add the VITE_FIREBASE_* values and restart the app.');
      return;
    }
    setBusy(true);
    try {
      await signInGoogle();
      onSuccess?.('Signed in with Google.');
      onClose();
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-[#143329] text-white px-6 py-4 flex items-center justify-between">
          <h3 className="text-base font-bold font-heading">
            {mode === 'sign-up' ? 'Create your account' : mode === 'reset' ? 'Reset password' : 'Sign in'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-full text-slate-300 hover:text-white" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        {mode !== 'reset' && (
          <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => { setMode('sign-in'); setError(null); }}
              className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
                mode === 'sign-in' ? 'bg-white text-forest-900 border-b-2 border-forest-900' : 'hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('sign-up'); setError(null); }}
              className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
                mode === 'sign-up' ? 'bg-white text-forest-900 border-b-2 border-forest-900' : 'hover:text-slate-900'
              }`}
            >
              Register
            </button>
          </div>
        )}
        <form onSubmit={submit} className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            {mode === 'sign-up'
              ? 'Your free account includes a store-credit wallet. Spin & Win prizes are deposited straight into it and come off your next online order.'
              : 'Sign in to keep your cart, place an order, see your order history and use your wallet credit. Checkout is pay by EFT or on collection.'}
          </p>
          {mode === 'sign-up' && (
            <label className="block text-xs font-semibold text-slate-700">
              Name
              <span className="mt-1 flex items-center gap-2 border border-slate-200 rounded-xl px-3">
                <UserRound className="w-4 h-4 text-slate-400" />
                <input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full py-2.5 text-sm outline-none"
                  placeholder="Your name"
                />
              </span>
            </label>
          )}
          <label className="block text-xs font-semibold text-slate-700">
            Email
            <span className="mt-1 flex items-center gap-2 border border-slate-200 rounded-xl px-3">
              <Mail className="w-4 h-4 text-slate-400" />
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full py-2.5 text-sm outline-none"
                placeholder="you@email.co.za"
              />
            </span>
          </label>
          {mode !== 'reset' && (
            <label className="block text-xs font-semibold text-slate-700">
              Password
              <span className="mt-1 flex items-center gap-2 border border-slate-200 rounded-xl px-3">
                <Lock className="w-4 h-4 text-slate-400" />
                <input
                  required
                  type="password"
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full py-2.5 text-sm outline-none"
                  placeholder="At least 6 characters"
                />
              </span>
            </label>
          )}
          {error && <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-full bg-[#1e8755] hover:bg-[#166c43] text-white text-xs font-bold uppercase tracking-wider disabled:opacity-60"
          >
            {busy ? 'Please wait…' : mode === 'sign-up' ? 'Create account' : mode === 'reset' ? 'Send reset email' : 'Sign in'}
          </button>
          {mode !== 'reset' && (
            <>
              <div className="relative flex items-center justify-center my-1">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-2 text-[11px] uppercase tracking-wider text-slate-400 font-semibold absolute">or</span>
              </div>
              <button
                type="button"
                onClick={google}
                disabled={busy}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2.5 transition-colors cursor-pointer active:scale-98 shadow-xs"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>
            </>
          )}
          <div className="flex flex-col gap-1 text-[11px] text-slate-500">
            {mode === 'sign-in' && (
              <>
                <button type="button" className="text-left text-emerald-800 font-semibold" onClick={() => { setMode('sign-up'); setError(null); }}>
                  Need an account? Sign up
                </button>
                <button type="button" className="text-left underline" onClick={() => { setMode('reset'); setError(null); }}>
                  Forgot password
                </button>
              </>
            )}
            {mode !== 'sign-in' && (
              <button type="button" className="text-left text-emerald-800 font-semibold" onClick={() => { setMode('sign-in'); setError(null); }}>
                Already registered? Sign in
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
