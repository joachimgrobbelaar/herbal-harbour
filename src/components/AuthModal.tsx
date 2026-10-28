import React, { useState } from 'react';
import { X, Mail, Lock, UserRound } from 'lucide-react';
import { friendlyAuthError, useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

type Mode = 'sign-in' | 'sign-up' | 'reset';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { firebaseReady, signInEmail, signUpEmail, signInGoogle, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>('sign-in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
        <form onSubmit={submit} className="p-6 space-y-4">
          <p className="text-xs text-slate-500">
            Sign in to keep your cart, place an order, and see your order history. Checkout is pay by EFT or on collection.
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
            <button
              type="button"
              onClick={google}
              disabled={busy}
              className="w-full py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Continue with Google
            </button>
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
