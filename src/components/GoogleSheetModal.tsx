import React from 'react';
import { X, FileSpreadsheet } from 'lucide-react';

interface GoogleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdmin?: () => void;
  isAdmin?: boolean;
}

export const GoogleSheetModal: React.FC<GoogleSheetModalProps> = ({
  isOpen,
  onClose,
  onOpenAdmin,
  isAdmin,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-[#143329] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
            <h3 className="text-base font-bold font-heading">Shop spreadsheet</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-300 hover:text-white" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 text-sm text-slate-600 space-y-3">
          <p>
            Products, stock, orders, and stock movements live in the shop MySQL database. Excel refreshes them from the API export, and the shop desk can download an <strong>.xlsx</strong> snapshot at any time.
          </p>
          <p>
            The catalogue is not read back from the spreadsheet, so a cell edit cannot overwrite stock. A copy of <strong>HerbalHarbour-Live.xlsx</strong> is in the repo for Data → From Web.
          </p>
          <p className="text-xs text-slate-500">
            Firebase Hosting stays on the Spark plan. The database is MySQL on the herbalharbour.co.za hosting account.
          </p>
          {isAdmin && onOpenAdmin && (
            <button
              onClick={() => { onClose(); onOpenAdmin(); }}
              className="px-4 py-2 rounded-full bg-[#1e8755] text-white text-xs font-bold"
            >
              Open shop desk
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
