import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  AlertTriangle,
  Boxes,
  ClipboardList,
  Download,
  PackagePlus,
  Plus,
  Store,
  Trash2,
} from 'lucide-react';
import { CannabisLeafIcon } from '../components/CannabisLeafIcon';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import { API_BASE } from '../lib/firebase';
import { isLowStock } from '../lib/productMap';
import { formatZar } from '../lib/pricing';
import { DEFAULT_LOW_STOCK, ORDER_STATUS_LABELS, PAYMENT_LABELS } from '../lib/shopConfig';
import { api, fetchCatalogue } from '../services/api';
import { downloadShopWorkbook } from '../services/exportWorkbook';
import { fetchAdminOrders, markOrderStatus, placeSale } from '../services/orders';
import { adjustStock, fetchMovements } from '../services/stock';
import type { CartItem, OrderStatus, PaymentMethod, Product, ProductCategory, ShopOrder, StockMovement, StrainType } from '../types';

interface AdminPageProps {
  onBackToStore: () => void;
  onNotify: (message: string) => void;
}

type Tab = 'orders' | 'products' | 'stock' | 'pos' | 'sheet';

const CATEGORIES: { id: ProductCategory; label: string }[] = [
  { id: 'flower', label: 'Craft Flower' },
  { id: 'seeds', label: 'Medicinal Seeds' },
  { id: 'tinctures', label: 'CBD Tinctures' },
  { id: 'edibles', label: 'Wellness Edibles' },
  { id: 'concentrates', label: 'Pure Concentrates' },
  { id: 'topicals', label: 'Therapeutic Topicals' },
];

const STRAINS: StrainType[] = ['Sativa', 'Indica', 'Hybrid', 'CBD-Rich'];

const emptyDraft = (): Product => ({
  id: '',
  name: '',
  subtitle: '',
  category: 'flower',
  categoryLabel: 'Craft Flower',
  strainType: 'Hybrid',
  price: 0,
  rating: 0,
  reviewCount: 0,
  thc: '',
  cbd: '',
  terpenes: [],
  effects: [],
  medicalUses: [],
  description: '',
  dosageGuide: '',
  inStock: true,
  stock: 0,
  lowStockThreshold: DEFAULT_LOW_STOCK,
  active: true,
  labTestedDate: '',
  batchNumber: '',
  imageUrl: '',
  colorGradient: 'from-emerald-100 to-amber-100',
});

export const AdminPage: React.FC<AdminPageProps> = ({ onBackToStore, onNotify }) => {
  const { user } = useAuth();
  const { allProducts: shopProducts, catalogSource, refreshCatalog } = useShop();
  const [adminProducts, setAdminProducts] = useState<Product[] | null>(null);
  const allProducts = adminProducts ?? shopProducts;
  const [tab, setTab] = useState<Tab>('orders');
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [sheetId, setSheetId] = useState('');
  const [draft, setDraft] = useState<Product | null>(null);
  const [ticket, setTicket] = useState<CartItem[]>([]);
  const [posName, setPosName] = useState('Walk-in');
  const [posPayment, setPosPayment] = useState<PaymentMethod>('pay_on_collection');
  const [posPaid, setPosPaid] = useState(true);
  const [adjustProductId, setAdjustProductId] = useState('');
  const [adjustDelta, setAdjustDelta] = useState('1');
  const [adjustReason, setAdjustReason] = useState('Delivery received');
  const [busy, setBusy] = useState(false);

  const reloadDesk = async () => {
    const [nextOrders, nextMovements, settings] = await Promise.all([
      fetchAdminOrders(),
      fetchMovements(),
      api<{ spreadsheetId: string }>('/admin/settings').catch(() => ({ spreadsheetId: '' })),
    ]);
    setOrders(nextOrders);
    setMovements(nextMovements);
    setSheetId(settings.spreadsheetId || '');
  };

  useEffect(() => {
    let cancelled = false;
    fetchCatalogue(true).then((rows) => {
      if (!cancelled) setAdminProducts(rows);
    }).catch(() => {
      if (!cancelled) setAdminProducts(null);
    });
    return () => {
      cancelled = true;
    };
  }, [shopProducts]);

  useEffect(() => {
    let stop = false;
    const tick = () => {
      reloadDesk().catch(() => {
        if (!stop) {
          setOrders([]);
          setMovements([]);
        }
      });
    };
    tick();
    const timer = window.setInterval(tick, 20000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, []);

  const lowStock = useMemo(() => allProducts.filter(isLowStock), [allProducts]);
  const posTotal = ticket.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    try {
      await work();
    } catch (error) {
      onNotify(error instanceof Error ? error.message : 'That action failed.');
    } finally {
      setBusy(false);
    }
  };

  const saveProduct = () => run(async () => {
    if (!draft || !user) return;
    if (!draft.name.trim()) throw new Error('Product name is required.');
    if (!draft.id) {
      await api('/admin/products', { body: draft });
      onNotify(`Added ${draft.name}.`);
    } else {
      await api(`/admin/products/${draft.id}`, { method: 'PUT', body: draft });
      onNotify(`Saved ${draft.name}.`);
    }
    setDraft(null);
    await refreshCatalog();
    await reloadDesk();
  });

  const removeProduct = (product: Product) => run(async () => {
    if (!window.confirm(`Remove ${product.name} from the catalogue?`)) return;
    await api(`/admin/products/${product.id}`, { method: 'DELETE' });
    onNotify(`${product.name} removed.`);
    await refreshCatalog();
  });

  const applyAdjustment = () => run(async () => {
    const stockAfter = await adjustStock({
      productId: adjustProductId,
      delta: Number(adjustDelta),
      reason: adjustReason,
    });
    onNotify(`Stock is now ${stockAfter}.`);
    await refreshCatalog();
    await reloadDesk();
  });

  const changeStatus = (order: ShopOrder, status: OrderStatus) => run(async () => {
    if (status === 'pending') return;
    await markOrderStatus(order.id, status);
    onNotify(status === 'cancelled'
      ? `${order.orderNumber} cancelled and restocked.`
      : `${order.orderNumber} marked ${ORDER_STATUS_LABELS[status].toLowerCase()}.`);
    await refreshCatalog();
    await reloadDesk();
  });

  const completePos = () => run(async () => {
    if (!user) return;
    if (!ticket.length) throw new Error('Add items to the sale first.');
    const order = await placeSale({
      channel: 'pos',
      status: posPaid ? 'paid' : 'pending',
      paymentMethod: posPayment,
      items: ticket,
      customerName: posName.trim() || 'Walk-in',
      email: user.email || 'pos@herbalharbour.co.za',
      phone: 'in-store',
      address: 'In-store collection',
      city: 'Cape Town',
      postalCode: '8001',
      province: 'Western Cape',
      notes: 'Point of sale',
    });
    setTicket([]);
    onNotify(`In-store sale ${order.orderNumber} recorded.`);
    await refreshCatalog();
    await reloadDesk();
  });

  const saveSheet = () => run(async () => {
    await api('/admin/settings', { method: 'PUT', body: { spreadsheetId: sheetId.trim() } });
    onNotify('Spreadsheet id saved for the optional cron sync.');
  });

  const tabs: { id: Tab; label: string }[] = [
    { id: 'orders', label: 'Orders' },
    { id: 'products', label: 'Products' },
    { id: 'stock', label: 'Stock' },
    { id: 'pos', label: 'Point of sale' },
    { id: 'sheet', label: 'Spreadsheet' },
  ];

  return (
    <div className="min-h-screen bg-[#f7f8f7] text-slate-800">
      <header className="bg-[#122e24] text-white py-3.5 px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={onBackToStore} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20" aria-label="Back to shop">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <CannabisLeafIcon className="w-6 h-6 text-[#25a86a]" />
          <div>
            <h1 className="text-base font-bold font-heading">Herbal Harbour · Shop desk</h1>
            <p className="text-[11px] text-emerald-200">{user?.email}</p>
          </div>
        </div>
        <button onClick={onBackToStore} className="px-4 py-1.5 rounded-full bg-emerald-600 text-xs font-bold uppercase">
          Back to shop
        </button>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {catalogSource !== 'live' && (
          <p className="mb-4 text-xs bg-amber-50 border border-amber-200 text-amber-950 rounded-2xl p-4">
            The shop API is not reachable, so this is the sample catalogue. Import <code>server/schema.sql</code> and <code>server/seed.sql</code> before selling.
          </p>
        )}
        {lowStock.length > 0 && catalogSource === 'live' && (
          <div className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-950">
            <p className="font-bold flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4" />
              Low stock
            </p>
            {lowStock.map((product) => (
              <span key={product.id} className="inline-block mr-3">
                {product.name}: {product.stock} left (alert at {product.lowStockThreshold})
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-5">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold ${tab === item.id ? 'bg-[#143329] text-white' : 'bg-white border border-slate-200 text-slate-700'}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === 'orders' && (
          <section className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-emerald-700" />
              <h2 className="font-bold">Orders</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase">
                  <tr>
                    <th className="p-3">Order</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Channel</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 && (
                    <tr><td colSpan={6} className="p-6 text-slate-500">No orders yet.</td></tr>
                  )}
                  {orders.map((order) => (
                    <tr key={order.id} className="border-t border-slate-100 align-top">
                      <td className="p-3">
                        <div className="font-mono font-bold">{order.orderNumber}</div>
                        <div className="text-slate-500">{order.createdAt ? order.createdAt.toLocaleString('en-ZA') : ''}</div>
                        <div className="text-slate-500">{PAYMENT_LABELS[order.paymentMethod]}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold">{order.customerName}</div>
                        <div className="text-slate-500">{order.email}</div>
                        <div className="text-slate-500">{order.items.map((item) => `${item.quantity}× ${item.name}`).join(', ')}</div>
                      </td>
                      <td className="p-3 uppercase">{order.channel}</td>
                      <td className="p-3 text-right font-mono">{formatZar(order.total)}</td>
                      <td className="p-3 font-bold text-emerald-800">{ORDER_STATUS_LABELS[order.status]}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {order.status === 'pending' && (
                            <button disabled={busy} onClick={() => changeStatus(order, 'paid')} className="px-2 py-1 rounded-lg bg-emerald-600 text-white">Mark paid</button>
                          )}
                          {(order.status === 'pending' || order.status === 'paid') && (
                            <button disabled={busy} onClick={() => changeStatus(order, 'collected')} className="px-2 py-1 rounded-lg bg-[#143329] text-white">Collected</button>
                          )}
                          {(order.status === 'pending' || order.status === 'paid') && (
                            <button disabled={busy} onClick={() => changeStatus(order, 'cancelled')} className="px-2 py-1 rounded-lg border border-rose-300 text-rose-700">Cancel</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'products' && (
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-bold flex items-center gap-2"><PackagePlus className="w-4 h-4" /> Catalogue</h2>
              <button onClick={() => setDraft(emptyDraft())} className="px-3 py-1.5 rounded-full bg-[#1e8755] text-white text-xs font-bold">
                New product
              </button>
            </div>
            <div className="bg-white rounded-3xl border border-slate-200 overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase">
                  <tr>
                    <th className="p-3 text-left">Product</th>
                    <th className="p-3 text-right">Price</th>
                    <th className="p-3 text-right">Stock</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody>
                  {allProducts.map((product) => (
                    <tr key={product.id} className="border-t border-slate-100">
                      <td className="p-3">
                        <div className="font-bold">{product.name}</div>
                        <div className="text-slate-500">{product.categoryLabel} · {product.strainType}</div>
                      </td>
                      <td className="p-3 text-right font-mono">{formatZar(product.price)}</td>
                      <td className="p-3 text-right font-mono">{product.stock}</td>
                      <td className="p-3">{product.active ? (product.stock > 0 ? 'For sale' : 'Out of stock') : 'Hidden'}</td>
                      <td className="p-3 text-right space-x-2">
                        <button onClick={() => setDraft(product)} className="font-bold text-emerald-800">Edit</button>
                        <button onClick={() => removeProduct(product)} className="text-rose-700" aria-label={`Delete ${product.name}`}>
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {draft && (
              <form
                onSubmit={(event) => { event.preventDefault(); saveProduct(); }}
                className="bg-white rounded-3xl border border-slate-200 p-5 grid sm:grid-cols-2 gap-3 text-xs"
              >
                <label className="sm:col-span-2 font-bold text-slate-700">
                  Name
                  <input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="mt-1 w-full border border-slate-200 rounded-xl p-2 font-normal" />
                </label>
                <label className="sm:col-span-2 font-bold text-slate-700">
                  Subtitle
                  <input value={draft.subtitle} onChange={(event) => setDraft({ ...draft, subtitle: event.target.value })} className="mt-1 w-full border border-slate-200 rounded-xl p-2 font-normal" />
                </label>
                <label className="font-bold text-slate-700">
                  Category
                  <select
                    value={draft.category}
                    onChange={(event) => {
                      const category = event.target.value as ProductCategory;
                      const label = CATEGORIES.find((item) => item.id === category)?.label || category;
                      setDraft({ ...draft, category, categoryLabel: label });
                    }}
                    className="mt-1 w-full border border-slate-200 rounded-xl p-2 font-normal bg-white"
                  >
                    {CATEGORIES.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
                  </select>
                </label>
                <label className="font-bold text-slate-700">
                  Strain
                  <select value={draft.strainType} onChange={(event) => setDraft({ ...draft, strainType: event.target.value as StrainType })} className="mt-1 w-full border border-slate-200 rounded-xl p-2 font-normal bg-white">
                    {STRAINS.map((strain) => <option key={strain}>{strain}</option>)}
                  </select>
                </label>
                <label className="font-bold text-slate-700">
                  Price (ZAR)
                  <input type="number" min="0" step="0.01" value={draft.price} onChange={(event) => setDraft({ ...draft, price: Number(event.target.value) })} className="mt-1 w-full border border-slate-200 rounded-xl p-2 font-normal" />
                </label>
                <label className="font-bold text-slate-700">
                  Stock
                  <input type="number" min="0" step="1" value={draft.stock} onChange={(event) => setDraft({ ...draft, stock: Math.max(0, Math.floor(Number(event.target.value) || 0)) })} className="mt-1 w-full border border-slate-200 rounded-xl p-2 font-normal" />
                </label>
                <label className="font-bold text-slate-700">
                  Low-stock alert at
                  <input type="number" min="0" step="1" value={draft.lowStockThreshold} onChange={(event) => setDraft({ ...draft, lowStockThreshold: Math.max(0, Math.floor(Number(event.target.value) || 0)) })} className="mt-1 w-full border border-slate-200 rounded-xl p-2 font-normal" />
                </label>
                <label className="font-bold text-slate-700">
                  THC
                  <input value={draft.thc} onChange={(event) => setDraft({ ...draft, thc: event.target.value })} className="mt-1 w-full border border-slate-200 rounded-xl p-2 font-normal" />
                </label>
                <label className="font-bold text-slate-700">
                  CBD
                  <input value={draft.cbd} onChange={(event) => setDraft({ ...draft, cbd: event.target.value })} className="mt-1 w-full border border-slate-200 rounded-xl p-2 font-normal" />
                </label>
                <label className="font-bold text-slate-700 flex items-center gap-2 mt-6">
                  <input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} />
                  Visible in the shop
                </label>
                <label className="sm:col-span-2 font-bold text-slate-700">
                  Description
                  <textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className="mt-1 w-full border border-slate-200 rounded-xl p-2 font-normal" rows={3} />
                </label>
                <div className="sm:col-span-2 flex gap-2">
                  <button type="submit" disabled={busy} className="px-4 py-2 rounded-full bg-[#1e8755] text-white font-bold">Save product</button>
                  <button type="button" onClick={() => setDraft(null)} className="px-4 py-2 rounded-full border border-slate-300">Cancel</button>
                </div>
              </form>
            )}
          </section>
        )}

        {tab === 'stock' && (
          <section className="grid lg:grid-cols-5 gap-4">
            <form
              onSubmit={(event) => { event.preventDefault(); applyAdjustment(); }}
              className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-5 space-y-3 text-xs"
            >
              <h2 className="font-bold flex items-center gap-2"><Boxes className="w-4 h-4" /> Adjust stock</h2>
              <label className="block font-bold">
                Product
                <select required value={adjustProductId} onChange={(event) => setAdjustProductId(event.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl p-2 font-normal bg-white">
                  <option value="">Choose…</option>
                  {allProducts.map((product) => (
                    <option key={product.id} value={product.id}>{product.name} ({product.stock})</option>
                  ))}
                </select>
              </label>
              <label className="block font-bold">
                Change (use a negative number to remove)
                <input required type="number" step="1" value={adjustDelta} onChange={(event) => setAdjustDelta(event.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl p-2 font-normal" />
              </label>
              <label className="block font-bold">
                Reason
                <input required value={adjustReason} onChange={(event) => setAdjustReason(event.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl p-2 font-normal" />
              </label>
              <button disabled={busy} className="px-4 py-2 rounded-full bg-[#143329] text-white font-bold">Save adjustment</button>
            </form>
            <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 overflow-hidden">
              <h2 className="p-5 font-bold border-b border-slate-100">Stock movements</h2>
              <div className="max-h-[32rem] overflow-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase sticky top-0">
                    <tr>
                      <th className="p-3 text-left">When</th>
                      <th className="p-3 text-left">Product</th>
                      <th className="p-3 text-right">Change</th>
                      <th className="p-3 text-left">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.length === 0 && <tr><td colSpan={4} className="p-4 text-slate-500">No movements yet.</td></tr>}
                    {movements.map((movement) => (
                      <tr key={movement.id} className="border-t border-slate-100">
                        <td className="p-3 whitespace-nowrap">{movement.createdAt ? movement.createdAt.toLocaleString('en-ZA') : ''}</td>
                        <td className="p-3">{movement.productName}</td>
                        <td className={`p-3 text-right font-mono ${movement.delta < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                          {movement.delta > 0 ? '+' : ''}{movement.delta} → {movement.stockAfter}
                        </td>
                        <td className="p-3">{movement.reason} <span className="text-slate-400">({movement.channel})</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {tab === 'pos' && (
          <section className="grid lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-4">
              <h2 className="font-bold mb-3 flex items-center gap-2"><Store className="w-4 h-4" /> Till</h2>
              <div className="grid sm:grid-cols-2 gap-2 max-h-[28rem] overflow-auto">
                {allProducts.filter((product) => product.active).map((product) => (
                  <button
                    key={product.id}
                    disabled={product.stock <= 0}
                    onClick={() => {
                      setTicket((prev) => {
                        const existing = prev.find((item) => item.product.id === product.id);
                        const nextQty = (existing?.quantity || 0) + 1;
                        if (nextQty > product.stock) return prev;
                        if (!existing) return [...prev, { product, quantity: 1 }];
                        return prev.map((item) => item.product.id === product.id ? { ...item, quantity: nextQty, product } : item);
                      });
                    }}
                    className="text-left p-3 rounded-2xl border border-slate-200 hover:border-emerald-400 disabled:opacity-40"
                  >
                    <div className="font-bold text-sm">{product.name}</div>
                    <div className="text-[11px] text-slate-500">{formatZar(product.price)} · {product.stock} in stock</div>
                  </button>
                ))}
              </div>
            </div>
            <form
              onSubmit={(event) => { event.preventDefault(); completePos(); }}
              className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 text-xs"
            >
              <h2 className="font-bold">Current sale</h2>
              {ticket.length === 0 && <p className="text-slate-500">Tap a product to add it.</p>}
              {ticket.map((item) => (
                <div key={item.product.id} className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{item.product.name}</span>
                  <span className="flex items-center gap-2">
                    <button type="button" onClick={() => setTicket((prev) => prev.flatMap((line) => {
                      if (line.product.id !== item.product.id) return [line];
                      return line.quantity <= 1 ? [] : [{ ...line, quantity: line.quantity - 1 }];
                    }))} className="px-2 py-1 border rounded-lg">-</button>
                    <span className="font-mono">{item.quantity}</span>
                    <button type="button" onClick={() => setTicket((prev) => prev.map((line) => line.product.id === item.product.id && line.quantity < line.product.stock ? { ...line, quantity: line.quantity + 1 } : line))} className="px-2 py-1 border rounded-lg">
                      <Plus className="w-3 h-3" />
                    </button>
                    <span className="font-mono w-16 text-right">{formatZar(item.product.price * item.quantity)}</span>
                  </span>
                </div>
              ))}
              <label className="block font-bold">
                Customer
                <input value={posName} onChange={(event) => setPosName(event.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl p-2 font-normal" />
              </label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setPosPayment('pay_on_collection')} className={`flex-1 py-2 rounded-xl border ${posPayment === 'pay_on_collection' ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200'}`}>Pay on collection</button>
                <button type="button" onClick={() => setPosPayment('eft')} className={`flex-1 py-2 rounded-xl border ${posPayment === 'eft' ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200'}`}>EFT</button>
              </div>
              <label className="flex items-center gap-2 font-semibold">
                <input type="checkbox" checked={posPaid} onChange={(event) => setPosPaid(event.target.checked)} />
                Payment received now (mark paid)
              </label>
              <div className="flex items-center justify-between text-sm font-bold">
                <span>Total</span>
                <span className="font-mono">{formatZar(posTotal)}</span>
              </div>
              <button disabled={busy || ticket.length === 0} className="w-full py-3 rounded-full bg-[#1e8755] text-white font-bold uppercase tracking-wider disabled:opacity-50">
                Record sale and update stock
              </button>
            </form>
          </section>
        )}

        {tab === 'sheet' && (
          <section className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 text-sm">
            <h2 className="font-bold">Spreadsheet</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Excel can refresh the shop from <span className="font-mono">{API_BASE}/export.php?sheet=products&amp;format=csv&amp;key=YOUR_EXPORT_KEY</span> (and the same URL with <span className="font-mono">sheet=orders</span> or <span className="font-mono">sheet=movements</span>).
              The key lives in <span className="font-mono">server/config.php</span>. Open <span className="font-mono">HerbalHarbour-Live.xlsx</span>, paste the key, and set refresh every 10 minutes.
              This download is a snapshot of the desk. An optional cron can also push a Google Sheet. Neither needs the Firebase Blaze plan.
            </p>
            <label className="block text-xs font-bold">
              Google Sheet id
              <input value={sheetId} onChange={(event) => setSheetId(event.target.value)} placeholder="From the sheet URL: /spreadsheets/d/THIS_PART/edit" className="mt-1 w-full border border-slate-200 rounded-xl p-2 font-mono font-normal" />
            </label>
            <div className="flex flex-wrap gap-2">
              <button onClick={saveSheet} disabled={busy} className="px-4 py-2 rounded-full bg-[#143329] text-white text-xs font-bold">Save sheet id</button>
              <button
                onClick={() => downloadShopWorkbook(allProducts, orders, movements)}
                className="px-4 py-2 rounded-full bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                Export to .xlsx
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Share the sheet with the Cloud Functions service account as an editor. Setup steps are in the README.
              This export is a snapshot of what is loaded in the desk right now ({allProducts.length} products, {orders.length} orders, {movements.length} movements).
            </p>
          </section>
        )}
      </div>
    </div>
  );
};
