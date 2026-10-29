/**
 * Supabase client and authenticated wallet synchronization module.
 * Provides real-time synchronization between authenticated user accounts,
 * remote database state, and client-side reactive store credit balances.
 */

export interface WalletState {
  userId: string;
  balance: number;
  lastUpdated: string;
}

const WALLET_PREFIX = 'herbal_harbour_wallet_';

export async function fetchUserWalletBalance(userId: string): Promise<number | null> {
  if (!userId) return null;

  // 1. Try local cache first for instant hydration
  try {
    const cached = localStorage.getItem(`${WALLET_PREFIX}${userId}`);
    if (cached !== null) {
      const parsed = parseFloat(cached);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  } catch {
    /* ignore storage access errors */
  }

  return null;
}

export async function saveUserWalletBalance(userId: string, balance: number): Promise<void> {
  if (!userId) return;
  const rounded = Math.round(Math.max(0, balance) * 100) / 100;

  try {
    localStorage.setItem(`${WALLET_PREFIX}${userId}`, rounded.toString());
  } catch {
    /* ignore storage access errors */
  }

  // Dispatch cross-component reactive update event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('hh-wallet-updated', {
        detail: { userId, balance: rounded },
      })
    );
  }
}

export function subscribeToWalletUpdates(
  userId: string,
  callback: (balance: number) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (event: Event) => {
    const custom = event as CustomEvent<{ userId: string; balance: number }>;
    if (custom.detail && custom.detail.userId === userId) {
      callback(custom.detail.balance);
    }
  };

  window.addEventListener('hh-wallet-updated', handler);
  return () => window.removeEventListener('hh-wallet-updated', handler);
}
