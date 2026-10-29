import React, { useState, useEffect, useRef } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  ArrowLeft, 
  Edit3, 
  Check, 
  Trash2, 
  Upload, 
  Image as ImageIcon, 
  Tag, 
  SlidersHorizontal, 
  Sparkles, 
  CheckCircle2, 
  X, 
  Save, 
  AlertCircle,
  Eye,
  Wallet,
  Building2,
  Box
} from 'lucide-react';
import { Product, ProductCategory, StrainType } from '../types';
import { CannabisLeafIcon } from '../components/CannabisLeafIcon';

interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  walletBalance: number;
  freeSpinsRemaining: number;
  ordersCount: number;
  totalSpent: number;
  lastActive: string;
}

interface AdminPageProps {
  onBackToStore: () => void;
  currentUserEmail: string;
  products: Product[];
  onSaveProducts: (products: Product[]) => void;
}

const CATEGORIES: { id: ProductCategory; label: string; defaultModel: string }[] = [
  { id: 'flower', label: 'Craft Flower', defaultModel: 'assets/models/weed_nug_1.glb' },
  { id: 'psilocybin', label: 'Sacred Mycology & Microdosing', defaultModel: 'assets/models/psilocybin_mushroom.glb' },
  { id: 'seeds', label: 'Medicinal Seeds', defaultModel: 'assets/models/seed.glb' },
  { id: 'tinctures', label: 'CBD Tinctures', defaultModel: 'assets/models/vape_pen.glb' },
  { id: 'edibles', label: 'Edibles & Wellness', defaultModel: 'assets/models/brownie_01.glb' },
  { id: 'concentrates', label: 'Pure Concentrates', defaultModel: 'assets/models/glass_bong.glb' },
  { id: 'topicals', label: 'Topicals & Balms', defaultModel: 'assets/models/cream_bottle.glb' },
];

const STRAIN_TYPES: StrainType[] = ['Sativa', 'Indica', 'Hybrid', 'CBD-Rich'];
const TERPENE_OPTIONS = ['Myrcene', 'Limonene', 'Caryophyllene', 'Terpinolene', 'Pinene', 'Linalool', 'Humulene', 'Ocimene'];
const EFFECT_OPTIONS = ['Euphoric', 'Relaxing', 'Creative', 'Energy', 'Pain Relief', 'Sleep Aid', 'Focus', 'Anti-Inflammatory'];

export const AdminPage: React.FC<AdminPageProps> = ({
  onBackToStore,
  currentUserEmail,
  products,
  onSaveProducts,
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'add' | 'wallets'>('inventory');
  const [search, setSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // In-line price editing states: { [productId]: string }
  const [editingPrices, setEditingPrices] = useState<Record<string, string>>({});

  // Full product edit modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // New product form states
  const [newName, setNewName] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newCategory, setNewCategory] = useState<ProductCategory>('flower');
  const [newStrainType, setNewStrainType] = useState<StrainType>('Sativa');
  const [newPrice, setNewPrice] = useState('');
  const [newOriginalPrice, setNewOriginalPrice] = useState('');
  const [newThc, setNewThc] = useState('20.00%');
  const [newCbd, setNewCbd] = useState('0.50%');
  const [newTerpenes, setNewTerpenes] = useState<string[]>(['Myrcene', 'Limonene']);
  const [newEffects, setNewEffects] = useState<string[]>(['Euphoric', 'Creative']);
  const [newDescription, setNewDescription] = useState('');
  const [newDosage, setNewDosage] = useState('Start with 0.1g vaporization for gentle daytime relief.');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newModelUrl, setNewModelUrl] = useState('assets/models/weed_nug_1.glb');
  const [newBadge, setNewBadge] = useState('Fresh Harvest');
  const [newInStock, setNewInStock] = useState(true);
  const [newIsSale, setNewIsSale] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handle Image File Upload (converts file to base64 Data URL)
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isEditing = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (isEditing && editingProduct) {
        setEditingProduct({ ...editingProduct, imageUrl: dataUrl });
      } else {
        setNewImageUrl(dataUrl);
      }
      showToast('Image uploaded and preview ready!');
    };
    reader.readAsDataURL(file);
  };

  // Quick In-Line Price Update
  const handlePriceChange = (id: string, val: string) => {
    setEditingPrices((prev) => ({ ...prev, [id]: val }));
  };

  const handleSavePrice = (productId: string) => {
    const rawVal = editingPrices[productId];
    if (rawVal === undefined) return;
    const num = parseFloat(rawVal);
    if (isNaN(num) || num < 0) {
      alert('Please enter a valid price amount.');
      return;
    }

    const updated = products.map((p) => (p.id === productId ? { ...p, price: num } : p));
    onSaveProducts(updated);
    // Clear editing state for this product
    setEditingPrices((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
    showToast(`Price updated to R ${num.toFixed(2)}`);
  };

  // Toggle in-stock status
  const handleToggleStock = (productId: string) => {
    const updated = products.map((p) => (p.id === productId ? { ...p, inStock: !p.inStock } : p));
    onSaveProducts(updated);
    showToast('Stock availability updated');
  };

  // Toggle on-sale status
  const handleToggleSale = (productId: string) => {
    const updated = products.map((p) => (p.id === productId ? { ...p, isSale: !p.isSale } : p));
    onSaveProducts(updated);
    showToast('Sale status updated');
  };

  // Delete product
  const handleDeleteProduct = (productId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove '${name}' from the store catalog?`)) return;
    const updated = products.filter((p) => p.id !== productId);
    onSaveProducts(updated);
    showToast(`Removed '${name}' from catalog`);
  };

  // Save Full Product Edit
  const handleSaveFullEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const updated = products.map((p) => (p.id === editingProduct.id ? editingProduct : p));
    onSaveProducts(updated);
    setEditingProduct(null);
    showToast(`Saved changes for '${editingProduct.name}'`);
  };

  // Add New Product
  const handleAddNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPrice) {
      alert('Please enter at least product name and price.');
      return;
    }

    const categoryObj = CATEGORIES.find((c) => c.id === newCategory);
    const categoryLabel = categoryObj ? categoryObj.label : 'Craft Flower';

    const newProd: Product = {
      id: `prod-${newName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`,
      name: newName.trim(),
      subtitle: newSubtitle.trim() || 'Premium Dispensary Offering',
      category: newCategory,
      categoryLabel: categoryLabel,
      strainType: newStrainType,
      price: parseFloat(newPrice),
      originalPrice: newOriginalPrice ? parseFloat(newOriginalPrice) : undefined,
      rating: 5.0,
      reviewCount: 1,
      thc: newThc,
      cbd: newCbd,
      terpenes: newTerpenes,
      effects: newEffects,
      medicalUses: ['Stress Relief', 'Chronic Wellness'],
      description: newDescription.trim() || 'Craft medicinal cannabis cultivated with organic nutrients and slow-cured for optimal terpene preservation.',
      dosageGuide: newDosage.trim(),
      inStock: newInStock,
      isSale: newIsSale,
      isBestSeller: false,
      badge: newBadge || undefined,
      labTestedDate: 'Oct 2026',
      batchNumber: `HH-ZA-${Math.floor(100 + Math.random() * 900)}`,
      imageUrl: newImageUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
      modelUrl: newModelUrl || 'assets/models/weed_nug_1.glb',
      colorGradient: 'from-emerald-100 to-teal-100',
    };

    onSaveProducts([newProd, ...products]);
    showToast(`Added '${newProd.name}' for sale!`);
    
    // Reset form
    setNewName('');
    setNewSubtitle('');
    setNewPrice('');
    setNewOriginalPrice('');
    setNewDescription('');
    setNewImageUrl('');
    setActiveTab('inventory');
  };

  // Filter products for inventory list
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.categoryLabel.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategoryFilter === 'all' || p.category === selectedCategoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen bg-[#f8faf8] text-slate-800 pb-20">
      
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#143329] text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-2 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Admin Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToStore}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dispensary</span>
            </button>
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#143329] text-emerald-400 flex items-center justify-center">
                <CannabisLeafIcon className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black text-[#112d23] leading-none font-heading">
                  Dispensary Inventory &amp; Stock Manager
                </h1>
                <span className="text-[11px] text-slate-500">
                  Herbal Harbour • Direct Product &amp; Price Administration
                </span>
              </div>
            </div>
          </div>

          {/* Quick Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'inventory' ? 'bg-[#143329] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Inventory &amp; Prices ({products.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'add' ? 'bg-[#143329] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Add New Item</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* TAB 1: INVENTORY & PRICE EDITOR */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            
            {/* Top Toolbar */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-72">
                  <input
                    type="text"
                    placeholder="Search items by name or category..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-emerald-600"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>

                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setActiveTab('add')}
                className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-[#1e8755] hover:bg-[#166c43] text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item for Sale</span>
              </button>
            </div>

            {/* Products Table/Cards */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#143329] text-white font-heading text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Item &amp; Image</th>
                      <th className="py-3.5 px-4">Category &amp; Lineage</th>
                      <th className="py-3.5 px-4">Retail Price (ZAR R)</th>
                      <th className="py-3.5 px-4">Sale / Original</th>
                      <th className="py-3.5 px-4">Stock Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((p) => {
                      const isEditingPrice = editingPrices[p.id] !== undefined;
                      const currentPriceVal = isEditingPrice ? editingPrices[p.id] : p.price.toString();

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Image & Name */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                              />
                              <div>
                                <h4 className="font-extrabold text-slate-900 text-sm font-heading">{p.name}</h4>
                                <span className="text-[11px] text-slate-400 block truncate max-w-xs">{p.subtitle}</span>
                              </div>
                            </div>
                          </td>

                          {/* Category & Lineage */}
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-800 block">{p.categoryLabel}</span>
                            <span className="text-[11px] text-slate-500 block">{p.strainType} • THC {p.thc}</span>
                          </td>

                          {/* Editable Price */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-500 font-mono">R</span>
                              <input
                                type="number"
                                step="0.01"
                                value={currentPriceVal}
                                onChange={(e) => handlePriceChange(p.id, e.target.value)}
                                className="w-24 p-1.5 rounded-lg border border-slate-300 font-mono font-bold text-xs text-slate-900 outline-none focus:border-emerald-600 bg-white"
                              />
                              {isEditingPrice && (
                                <button
                                  onClick={() => handleSavePrice(p.id)}
                                  className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
                                  title="Save price change"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Sale Price status */}
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleToggleSale(p.id)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold cursor-pointer border ${
                                p.isSale
                                  ? 'bg-rose-50 text-rose-700 border-rose-300'
                                  : 'bg-slate-100 text-slate-500 border-slate-200'
                              }`}
                            >
                              {p.isSale ? '🔥 On Sale' : 'Regular Price'}
                            </button>
                            {p.originalPrice && (
                              <span className="block text-[10px] text-slate-400 line-through mt-0.5">
                                Was R {p.originalPrice.toFixed(2)}
                              </span>
                            )}
                          </td>

                          {/* Stock Toggle */}
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleToggleStock(p.id)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold cursor-pointer border ${
                                p.inStock
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : 'bg-amber-50 text-amber-800 border-amber-300'
                              }`}
                            >
                              {p.inStock ? '✓ In Stock' : '⚠️ Sold Out'}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setEditingProduct(p)}
                                className="p-2 rounded-xl text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 transition-colors cursor-pointer"
                                title="Edit Full Specs & Image"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id, p.name)}
                                className="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 transition-colors cursor-pointer"
                                title="Delete Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: ADD NEW ITEM FOR SALE */}
        {activeTab === 'add' && (
          <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="border-b border-slate-100 pb-4 mb-6">
              <h2 className="text-xl font-black text-[#112d23] font-heading">
                Add New Medical Cannabis Product for Sale
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Upload image, configure pricing in ZAR, choose category, cannabinoid specs, and 3D preview.
              </p>
            </div>

            <form onSubmit={handleAddNewProduct} className="space-y-6">
              
              {/* Image Upload Area */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Product Image (File Upload or Image URL) *
                </label>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 hover:border-emerald-500 transition-colors">
                  {newImageUrl ? (
                    <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-white shadow-xs">
                      <img src={newImageUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setNewImageUrl('')}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:bg-black"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-28 h-28 rounded-xl bg-slate-100 flex flex-col items-center justify-center text-slate-400 border border-slate-200 shrink-0">
                      <ImageIcon className="w-8 h-8 mb-1" />
                      <span className="text-[10px]">No Image</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-2 w-full">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => handleImageFileUpload(e, false)}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-[#143329] hover:bg-[#1a4437] text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Image from Computer</span>
                    </button>
                    <p className="text-[11px] text-slate-400">
                      Supports PNG, JPG, WEBP. Converted instantly for storefront display.
                    </p>
                    <div className="pt-1">
                      <input
                        type="text"
                        placeholder="Or paste an image web link (https://...)"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Name & Tagline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Durban Poison Heirloom"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-emerald-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Subtitle / Tagline
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pure South African Landrace Seeds (5 Pack)"
                    value={newSubtitle}
                    onChange={(e) => setNewSubtitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Category & Strain Lineage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Category *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => {
                      const cat = e.target.value as ProductCategory;
                      setNewCategory(cat);
                      const def = CATEGORIES.find((c) => c.id === cat);
                      if (def) setNewModelUrl(def.defaultModel);
                    }}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-600 bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Strain Lineage *
                  </label>
                  <select
                    value={newStrainType}
                    onChange={(e) => setNewStrainType(e.target.value as StrainType)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-600 bg-white"
                  >
                    {STRAIN_TYPES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price & Original Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Retail Price (ZAR R) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="250.00"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none focus:border-emerald-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Original Price (R) (Optional for Sale Display)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="300.00"
                    value={newOriginalPrice}
                    onChange={(e) => setNewOriginalPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Potency THC / CBD */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    THC Potency
                  </label>
                  <input
                    type="text"
                    value={newThc}
                    onChange={(e) => setNewThc(e.target.value)}
                    placeholder="22.00%"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    CBD Potency
                  </label>
                  <input
                    type="text"
                    value={newCbd}
                    onChange={(e) => setNewCbd(e.target.value)}
                    placeholder="0.50%"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* 3D Model Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Interactive 3D Model Asset (.GLB)
                </label>
                <select
                  value={newModelUrl}
                  onChange={(e) => setNewModelUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none focus:border-emerald-600 bg-white"
                >
                  <option value="assets/models/weed_nug_1.glb">weed_nug_1.glb (Flower Nug)</option>
                  <option value="assets/models/psilocybin_mushroom.glb">psilocybin_mushroom.glb (Sacred Mushroom Cluster)</option>
                  <option value="assets/models/cream_bottle.glb">cream_bottle.glb (Topical Cream & Balm Bottle)</option>
                  <option value="assets/models/cannabis_sativa_plant.glb">cannabis_sativa_plant.glb (Sativa Plant)</option>
                  <option value="assets/models/seed.glb">seed.glb (Feminized Seed)</option>
                  <option value="assets/models/vape_pen.glb">vape_pen.glb (Vape / Tincture Dropper)</option>
                  <option value="assets/models/brownie_01.glb">brownie_01.glb (Edible Brownie)</option>
                  <option value="assets/models/glass_bong.glb">glass_bong.glb (Glass Rig)</option>
                  <option value="assets/models/cryptobud.glb">cryptobud.glb (Cured Bud)</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Full Botanical Description
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Aromatic notes, genetic background, curing timeline..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-600"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('inventory')}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#1e8755] hover:bg-[#166c43] text-white font-extrabold text-xs uppercase tracking-wider shadow-md cursor-pointer transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publish Item for Sale</span>
                </button>
              </div>

            </form>
          </div>
        )}

      </main>

      {/* FULL PRODUCT EDIT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            
            <div className="bg-[#143329] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <h3 className="text-base font-bold font-heading">
                  Edit Item: {editingProduct.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFullEdit} className="p-6 space-y-5">
              
              {/* Image update */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Product Image
                </label>
                <div className="flex items-center gap-3">
                  <img
                    src={editingProduct.imageUrl}
                    alt={editingProduct.name}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                  />
                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      ref={editFileInputRef}
                      onChange={(e) => handleImageFileUpload(e, true)}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-slate-300"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Upload New Image</span>
                    </button>
                    <input
                      type="text"
                      value={editingProduct.imageUrl}
                      onChange={(e) => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })}
                      placeholder="Or enter image URL"
                      className="w-full px-3 py-1 text-xs border border-slate-200 rounded-lg outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Name & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Product Name</label>
                  <input
                    type="text"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:border-emerald-600 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tagline</label>
                  <input
                    type="text"
                    value={editingProduct.subtitle}
                    onChange={(e) => setEditingProduct({ ...editingProduct, subtitle: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none"
                  />
                </div>
              </div>

              {/* Price & Original Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Price (ZAR R)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-xl outline-none focus:border-emerald-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Original Price (R)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.originalPrice || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl outline-none"
                  />
                </div>
              </div>

              {/* Category & Strain */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => {
                      const cat = e.target.value as ProductCategory;
                      const catObj = CATEGORIES.find((c) => c.id === cat);
                      setEditingProduct({
                        ...editingProduct,
                        category: cat,
                        categoryLabel: catObj ? catObj.label : 'Craft Flower'
                      });
                    }}
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl outline-none bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Lineage</label>
                  <select
                    value={editingProduct.strainType}
                    onChange={(e) => setEditingProduct({ ...editingProduct, strainType: e.target.value as StrainType })}
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl outline-none bg-white"
                  >
                    {STRAIN_TYPES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3D Model URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">3D Model Asset</label>
                <select
                  value={editingProduct.modelUrl || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, modelUrl: e.target.value || undefined })}
                  className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-xl outline-none bg-white"
                >
                  <option value="assets/models/weed_nug_1.glb">weed_nug_1.glb (Flower Nug)</option>
                  <option value="assets/models/psilocybin_mushroom.glb">psilocybin_mushroom.glb (Sacred Mushroom Cluster)</option>
                  <option value="assets/models/cream_bottle.glb">cream_bottle.glb (Topical Cream & Balm Bottle)</option>
                  <option value="assets/models/cannabis_sativa_plant.glb">cannabis_sativa_plant.glb (Sativa Plant)</option>
                  <option value="assets/models/seed.glb">seed.glb (Feminized Seed)</option>
                  <option value="assets/models/vape_pen.glb">vape_pen.glb (Vape / Tincture)</option>
                  <option value="assets/models/brownie_01.glb">brownie_01.glb (Edibles)</option>
                  <option value="assets/models/glass_bong.glb">glass_bong.glb (Rig)</option>
                  <option value="assets/models/cryptobud.glb">cryptobud.glb (Cured Bud)</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#143329] hover:bg-[#1a4437] text-white text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
