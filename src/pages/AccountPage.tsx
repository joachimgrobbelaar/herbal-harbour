import React, { useEffect, useState } from 'react';
import { ArrowLeft, Package } from 'lucide-react';
import { CannabisLeafIcon } from '../components/CannabisLeafIcon';
import { useAuth } from '../context/AuthContext';
import { formatZar } from '../lib/pricing';
import { ORDER_STATUS_LABELS, PAYMENT_LABELS } from '../lib/shopConfig';
import { cancelOrder, fetchMyOrders } from '../services/orders';
import type { ShopOrder } from '../types';

interface AccountPageProps {
  onBack: () => void;
  onSignIn: () => void;
  onNotify: (message: string) => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({ onBack, onSignIn, onNotify }) => {
  const { user, firebaseReady, signOutUser } = useAuth();
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }
    let cancelled = false;
    fetchMyOrders().then((rows) => {
      if (!cancelled) setOrders(rows);
    }).catch(() => {
      if (!cancelled) setOrders([]);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const cancel = async (order: ShopOrder) => {
    if (!user) return;
    setBusyId(order.id);
    try {
      await cancelOrder(order.id);
      setOrders(await fetchMyOrders());
      onNotify(`Order ${order.orderNumber} cancelled and stock returned.`);
    } catch (error) {
      onNotify(error instanceof Error ? error.message : 'Could not cancel the order.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8f7] text-slate-800">
      <header className="bg-[#122e24] text-white py-3.5 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20" aria-label="Back to shop">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <CannabisLeafIcon className="w-6 h-6 text-[#25a86a]" />
          <h1 className="text-base font-bold font-heading">Your Herbal Harbour account</h1>
        </div>
        {user && (
          <button onClick={() => signOutUser()} className="text-xs font-bold text-emerald-200 hover:text-white">
            Sign out
          </button>
        )}
      </header>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {!firebaseReady && (
          <p className="text-sm bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4">
            Accounts need Firebase Auth. Add the web app keys from the Firebase console to <code>.env.local</code>.
          </p>
        )}
        {firebaseReady && !user && (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center">
            <p className="text-sm text-slate-600 mb-4">Sign in to see orders placed with this account.</p>
            <button onClick={onSignIn} className="px-5 py-2.5 rounded-full bg-[#1e8755] text-white text-xs font-bold uppercase">
              Sign in
            </button>
          </div>
        )}
        {user && (
          <>
            <div className="bg-white border border-slate-200 rounded-3xl p-5 mb-6">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Signed in as</p>
              <p className="text-lg font-bold text-slate-900">{user.displayName || 'Herbal Harbour customer'}</p>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
            <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-700" />
              Order history
            </h2>
            {orders.length === 0 ? (
              <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-2xl p-5">No orders yet.</p>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <article key={order.id} className="bg-white border border-slate-200 rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono font-bold text-sm">{order.orderNumber}</p>
                        <p className="text-[11px] text-slate-500">
                          {order.createdAt ? order.createdAt.toLocaleString('en-ZA') : 'Just now'} · {order.channel === 'pos' ? 'In store' : 'Online'} · {PAYMENT_LABELS[order.paymentMethod]}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold">{formatZar(order.total)}</p>
                        {(order.creditApplied ?? 0) > 0 && (
                          <p className="text-[11px] text-slate-500">Credit {formatZar(order.creditApplied ?? 0)}</p>
                        )}
                        <p className="text-[11px] uppercase tracking-wide text-emerald-800 font-bold">{ORDER_STATUS_LABELS[order.status]}</p>
                      </div>
                    </div>
                    <ul className="mt-3 text-xs text-slate-600 space-y-1">
                      {order.items.map((item, index) => (
                        <li key={`${order.id}-${item.productId}-${index}`}>{item.quantity} × {item.name}</li>
                      ))}
                    </ul>
                    {order.status === 'pending' && order.channel === 'online' && (
                      <button
                        onClick={() => cancel(order)}
                        disabled={busyId === order.id}
                        className="mt-3 text-xs font-bold text-rose-700 hover:text-rose-900 disabled:opacity-50"
                      >
                        {busyId === order.id ? 'Cancelling…' : 'Cancel order and restock'}
                      </button>
                    )}
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
