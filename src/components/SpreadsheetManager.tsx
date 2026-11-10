import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  Flame,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Percent,
  Tag,
  Trash2,
  ExternalLink,
  SlidersHorizontal,
  PackageCheck
} from 'lucide-react';
import { Product, ProductCategory } from '../types';
import {
  parseSpreadsheetFile,
  downloadSampleSpreadsheet,
  extractSheetId
} from '../services/spreadsheetService';
import { fetchGoogleSheetProducts } from '../services/googleSheets';

interface SpreadsheetManagerProps {
  currentProducts: Product[];
  onPublishToStore: (products: Product[], replace: boolean) => void;
  onResetDefault: () => void;
  showToast: (msg: string) => void;
}

export const SpreadsheetManager: React.FC<SpreadsheetManagerProps> = ({
  currentProducts,
  onPublishToStore,
  onResetDefault,
  showToast
}) => {
  const [inputMode, setInputMode] = useState<'file' | 'google-sheet'>('file');
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewProducts, setPreviewProducts] = useState<Product[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [discountPercent, setDiscountPercent] = useState<number>(15);
  const [publishMode, setPublishMode] = useState<'merge' | 'replace'>('replace');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle local Excel / CSV file upload
  const handleFileUpload = async (file: File) => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const res = await parseSpreadsheetFile(file);
      setPreviewProducts(res.products);
      showToast(`Loaded ${res.products.length} items from '${file.name}'`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not parse spreadsheet. Make sure it contains columns for Name and Price.');
    } finally {
      setIsLoading(false);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  // Handle Google Sheet link
  const handleGoogleSheetSync = async () => {
    setErrorMessage(null);
    const sheetId = extractSheetId(googleSheetUrl);
    if (!sheetId) {
      setErrorMessage('Please enter a valid Google Sheets URL (e.g. https://docs.google.com/spreadsheets/d/...)');
      return;
    }
    setIsLoading(true);
    try {
      const items = await fetchGoogleSheetProducts(sheetId);
      setPreviewProducts(items);
      showToast(`Successfully synced ${items.length} items from Google Sheets`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not fetch Google Sheet. Verify it is set to "Anyone with the link can view".');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle sale state on an individual preview product
  const toggleProductSale = (index: number) => {
    setPreviewProducts((prev) => {
      const copy = [...prev];
      const prod = { ...copy[index] };
      const nextSale = !prod.isSale;
      prod.isSale = nextSale;
      if (nextSale) {
        prod.badge = 'Sale';
        if (!prod.originalPrice || prod.originalPrice <= prod.price) {
          prod.originalPrice = Math.round(prod.price * (1 + discountPercent / 100));
        }
      } else {
        prod.badge = undefined;
        prod.originalPrice = undefined;
      }
      copy[index] = prod;
      return copy;
    });
  };

  // Apply discount and mark all as On Sale
  const handleMarkAllOnSale = (markSale: boolean) => {
    setPreviewProducts((prev) =>
      prev.map((p) => {
        if (!markSale) {
          return {
            ...p,
            isSale: false,
            badge: undefined,
            originalPrice: undefined
          };
        }
        const origPrice = Math.round(p.price * (1 + discountPercent / 100));
        return {
          ...p,
          isSale: true,
          badge: 'Sale',
          originalPrice: origPrice
        };
      })
    );
    showToast(markSale ? `Marked all items as On Sale with ${discountPercent}% discount!` : 'Cleared sale flags');
  };

  // Publish to site
  const handlePublish = () => {
    if (previewProducts.length === 0) return;
    onPublishToStore(previewProducts, publishMode === 'replace');
    const saleCount = previewProducts.filter((p) => p.isSale).length;
    showToast(
      `🎉 Published ${previewProducts.length} items to live store (${saleCount} on sale)!`
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Mode Selector */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 font-heading">
                Spreadsheet Inventory &amp; Live Sale Publisher
              </h2>
              <p className="text-xs text-slate-500">
                Upload your Excel or CSV product sheet, configure sale items, and publish directly to the live dispensary catalog.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={downloadSampleSpreadsheet}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Download pre-formatted Excel template"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Download Template (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Input Toggle: File Upload vs Google Sheets */}
        <div className="flex border-b border-slate-100 pb-4 gap-2">
          <button
            onClick={() => setInputMode('file')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              inputMode === 'file'
                ? 'bg-[#143329] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            Upload Excel (.xlsx, .xls, .csv)
          </button>
          <button
            onClick={() => setInputMode('google-sheet')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              inputMode === 'google-sheet'
                ? 'bg-[#143329] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            Connect Google Sheet URL
          </button>
        </div>

        {/* Option A: Dropzone File Upload */}
        {inputMode === 'file' && (
          <div className="mt-5">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]'
                  : 'border-slate-200 hover:border-emerald-400 hover:bg-slate-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={onFileInputChange}
                className="hidden"
              />
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
                <Upload className="w-6 h-6 text-emerald-700" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                Click to browse or drag and drop your spreadsheet here
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Supports Microsoft Excel (.xlsx, .xls) and CSV files. Columns for Name and Price will be automatically detected.
              </p>
            </div>
          </div>
        )}

        {/* Option B: Google Sheets URL */}
        {inputMode === 'google-sheet' && (
          <div className="mt-5 space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Google Sheets Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={googleSheetUrl}
                onChange={(e) => setGoogleSheetUrl(e.target.value)}
                className="flex-1 text-xs p-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-mono"
              />
              <button
                onClick={handleGoogleSheetSync}
                disabled={isLoading}
                className="px-5 py-3 rounded-xl bg-[#143329] hover:bg-[#1a4034] text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Syncing...' : 'Fetch Sheet'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Ensure sheet sharing is set to "Anyone with the link can view".
            </p>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Parsed Products Preview & Sale Publisher */}
      {previewProducts.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          
          {/* Header & Metric Chips */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-base font-black text-slate-900 font-heading">
                  Spreadsheet Preview: {previewProducts.length} Products Detected
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Review items, toggle sale status, and publish to the live dispensary.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold">
                Total: {previewProducts.length}
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-rose-500" />
                On Sale: {previewProducts.filter((p) => p.isSale).length}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold">
                In Stock: {previewProducts.filter((p) => p.inStock).length}
              </span>
            </div>
          </div>

          {/* Bulk Sale Controls */}
          <div className="bg-[#f8faf8] rounded-2xl p-4 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleMarkAllOnSale(true)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5 text-amber-200" />
                <span>Mark All as On Sale</span>
              </button>
              <button
                onClick={() => handleMarkAllOnSale(false)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                Clear All Sale Flags
              </button>
              
              <div className="flex items-center gap-1.5 text-xs text-slate-600 pl-2">
                <span>Sale Discount:</span>
                <input
                  type="number"
                  min="5"
                  max="80"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Math.max(5, Math.min(80, parseInt(e.target.value) || 15)))}
                  className="w-14 p-1 rounded-lg border border-slate-300 text-center text-xs font-bold bg-white"
                />
                <span>% off</span>
              </div>
            </div>

            {/* Merge vs Replace selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Publish mode:</span>
              <select
                value={publishMode}
                onChange={(e) => setPublishMode(e.target.value as 'merge' | 'replace')}
                className="p-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 outline-none"
              >
                <option value="replace">Replace Live Catalog ({previewProducts.length} items)</option>
                <option value="merge">Merge with Existing Catalog (+{previewProducts.length} items)</option>
              </select>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Strain</th>
                  <th className="py-3 px-3">Selling Price</th>
                  <th className="py-3 px-3">On Sale?</th>
                  <th className="py-3 px-3">Original Price</th>
                  <th className="py-3 px-3">Stock</th>
                  <th className="py-3 px-3">THC / CBD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {previewProducts.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {p.name}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {p.batchNumber}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {p.categoryLabel}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      {p.strainType}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-[#112d23]">
                      R {p.price.toFixed(2)}
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => toggleProductSale(idx)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          p.isSale
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        <Flame className={`w-3 h-3 ${p.isSale ? 'text-rose-600' : 'text-slate-400'}`} />
                        <span>{p.isSale ? 'ON SALE' : 'Regular'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono">
                      {p.originalPrice ? `R ${p.originalPrice.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.inStock
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {p.inStock ? 'In Stock' : 'Out'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                      {p.thc} | {p.cbd}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                setPreviewProducts([]);
                showToast('Cleared preview items');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 font-bold transition-colors cursor-pointer"
            >
              Cancel &amp; Clear Preview
            </button>

            <button
              onClick={handlePublish}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#143329] to-[#1e4d3e] hover:from-[#112d23] hover:to-[#183d31] text-white font-bold text-xs shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <PackageCheck className="w-4 h-4 text-emerald-400" />
              <span>Publish {previewProducts.length} Products to Store &amp; Sale</span>
            </button>
          </div>
        </div>
      )}

      {/* Live Store Status & Revert Options */}
      <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div>
          <span className="font-bold text-slate-800">Current Live Dispensary Products:</span>
          <span className="ml-2 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold font-mono">
            {currentProducts.length} Active Items
          </span>
          <span className="ml-2 text-slate-500">
            ({currentProducts.filter((p) => p.isSale).length} on sale)
          </span>
        </div>
        <button
          onClick={onResetDefault}
          className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-200 font-bold transition-colors cursor-pointer"
        >
          Revert to Default Herbal Harbour Catalog
        </button>
      </div>
    </div>
  );
};
