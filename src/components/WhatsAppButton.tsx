import React, { useState } from 'react';
import { MessageCircle, Phone, X, Send } from 'lucide-react';

interface WhatsAppButtonProps {
  phoneNumber?: string;
  defaultMessage?: string;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  phoneNumber = '27824591234',
  defaultMessage = 'Hi Herbal Harbour! I am browsing herbalharbour.co.za and would like to ask about available strains / place an order.'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customMsg, setCustomMsg] = useState(defaultMessage);

  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(customMsg)}`;

  const handleSend = () => {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 select-none">
      {/* Popover Chat Launcher */}
      {isOpen && (
        <div className="mb-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-[#25D366] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-sm leading-tight">Herbal Harbour Support</h4>
                <span className="text-[11px] text-white/90">Instant WhatsApp Order Desk</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full text-white/80 hover:text-white hover:bg-black/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 bg-[#f0f2f5] text-xs">
            <div className="bg-white p-3 rounded-xl rounded-tl-none shadow-xs mb-3 text-slate-800 leading-relaxed border border-slate-100">
              👋 Hey there! Welcome to Herbal Harbour South Africa. How can our botanical team help you today?
            </div>

            <textarea
              rows={3}
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-[#25D366]"
              placeholder="Type your message or order inquiry..."
            />

            <button
              onClick={handleSend}
              className="w-full mt-2.5 py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Start WhatsApp Chat</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Pill Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white px-4 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 active:scale-95 cursor-pointer group"
        title="Chat on WhatsApp"
        aria-label="Chat on WhatsApp"
      >
        <div className="relative">
          <MessageCircle className="w-5 h-5 fill-white text-transparent group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-white animate-ping" />
        </div>
        <span className="text-xs font-bold tracking-wide hidden sm:inline">
          Order on WhatsApp
        </span>
      </button>
    </div>
  );
};
