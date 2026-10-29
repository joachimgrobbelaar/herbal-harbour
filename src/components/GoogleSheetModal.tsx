import React, { useState } from 'react';
import { X, Table, RefreshCw, Check, AlertCircle, FileSpreadsheet, ExternalLink, HelpCircle } from 'lucide-react';
import { extractSheetId, fetchGoogleSheetProducts } from '../services/googleSheets';
import { Product } from '../types';

interface GoogleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncProducts: (products: Product[], sheetId: string, sheetUrl: string) => void;
  onResetToDefault: () => void;
  activeSheetUrl: string;
  isUsingGoogleSheet: boolean;
  itemCount: number;
}

export const GoogleSheetModal: React.FC<GoogleSheetModalProps> = ({
  isOpen,
  onClose,
  onSyncProducts,
  onResetToDefault,
  activeSheetUrl,
  isUsingGoogleSheet,
  itemCount
}) => {
  const [inputUrl, setInputUrl] = useState(activeSheetUrl || '');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSync = async (urlToUse?: string) => {
    const target = urlToUse || inputUrl;
    setErrorMessage(null);
    setStatusMessage(null);

    const sheetId = extractSheetId(target);
    if (!sheetId) {
      setErrorMessage('Please enter a valid Google Sheets URL (e.g. https://docs.google.com/spreadsheets/d/...)');
      return;
    }

    setIsLoading(true);
    try {
      const parsedProducts = await fetchGoogleSheetProducts(sheetId);
      onSyncProducts(parsedProducts, sheetId, target);
      setStatusMessage(`Successfully synced ${parsedProducts.length} items from Google Sheets!`);
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Could not load sheet. Please make sure your Google Sheet is shared with "Anyone with the link can view".'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = () => {
    // Demonstration sample sheet with cannabis items
    const sampleUrl = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0';
    setInputUrl(sampleUrl);
    handleSync(sampleUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header */}
        <div className="bg-[#143329] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold font-heading">
              Link Live Google Sheet Inventory
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Paste Your Google Sheet Document URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="flex-1 text-xs p-3 rounded-xl border border-slate-200 focus:border-[#25a86a] outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => handleSync()}
                disabled={isLoading}
                className="px-5 py-3 rounded-xl bg-[#1e8755] hover:bg-[#166c43] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
              >
                {isLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Sync Items</span>
              </button>
            </div>
          </div>

          {/* Status / Error Alerts */}
          {statusMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Current sync status badge */}
          {isUsingGoogleSheet && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="font-bold text-slate-800 block">Active Google Sheet Connected</span>
                <span className="text-slate-500 text-[11px]">{itemCount} items currently loaded in store</span>
              </div>
              <button
                onClick={onResetToDefault}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold underline cursor-pointer"
              >
                Disconnect & Revert
              </button>
            </div>
          )}

          {/* Instructions Box */}
          <div className="bg-[#f7faf8] rounded-2xl p-4 border border-emerald-900/10 text-xs text-slate-600 space-y-2">
            <div className="font-bold text-emerald-900 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-emerald-600" />
              How to setup your Google Sheet:
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1 leading-relaxed">
              <li>Open your Google Sheet with your inventory and prices.</li>
              <li>Include column headers: <strong>Name, Price, Category, THC, CBD, Description</strong>.</li>
              <li>Click <strong>Share</strong> in top-right of Google Sheets and select <strong>"Anyone with the link can view"</strong>.</li>
              <li>Paste the link above and click <strong>Sync Items</strong>.</li>
            </ol>
          </div>

          {/* Quick Demo Button */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={handleLoadSample}
              disabled={isLoading}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
            >
              <span>Need a test sheet? Click here to test sample sheet</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
