import React, { useState } from 'react';
import { X, Box, Sparkles, Upload, RotateCw, Layers, ShieldCheck, Download, HelpCircle } from 'lucide-react';
import { ThreeCanvas, ModelType } from './ThreeCanvas';

interface ThreeStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialModel?: ModelType;
}

export const ThreeStudioModal: React.FC<ThreeStudioModalProps> = ({
  isOpen,
  onClose,
  initialModel = 'bud'
}) => {
  const [selectedModel, setSelectedModel] = useState<ModelType>(initialModel);
  const [loadedModelName, setLoadedModelName] = useState<string>('Organic Cured Bud');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-[#0f241d] border border-emerald-500/30 text-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-emerald-950 flex items-center justify-between bg-[#143329]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black font-heading text-white">
                3D Dispensary Studio & OBJ Animator
              </h3>
              <p className="text-[11px] text-emerald-300">
                Interactive real-time WebGL 3D rendering • Drag & drop or upload your downloaded .OBJ files
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main 3D Canvas Area */}
        <div className="flex-1 p-4 sm:p-6 flex flex-col min-h-[440px]">
          <div className="flex-1 w-full relative rounded-2xl overflow-hidden border border-emerald-800/40 shadow-inner">
            <ThreeCanvas
              initialModel={selectedModel}
              className="w-full h-full min-h-[420px]"
              autoRotate={true}
              allowUpload={true}
              onModelLoaded={(name) => setLoadedModelName(name)}
            />
          </div>

          {/* Quick Info & Instructions */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-black/40 border border-emerald-900/60">
              <span className="font-bold text-amber-300 flex items-center gap-1 mb-1">
                <Upload className="w-3.5 h-3.5" /> Custom .OBJ Files
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Click <strong>"Load .OBJ"</strong> at the top right of the 3D view to open any OBJ and MTL 3D files from your device.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-black/40 border border-emerald-900/60">
              <span className="font-bold text-emerald-300 flex items-center gap-1 mb-1">
                <RotateCw className="w-3.5 h-3.5" /> 360° Free Orbit & Zoom
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Left-click & drag to rotate freely in 3D. Pinch or scroll to inspect trichome crystal heads and calyx structures.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-black/40 border border-emerald-900/60">
              <span className="font-bold text-cyan-300 flex items-center gap-1 mb-1">
                <Layers className="w-3.5 h-3.5" /> Lighting & Wireframe
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Switch between <strong>Studio</strong>, <strong>Warm Sunset</strong>, and <strong>UV Grow Light</strong>, or toggle wireframe mesh geometry.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-emerald-950 bg-[#0d1e17] flex items-center justify-between text-xs">
          <div className="text-slate-400 text-[11px]">
            Currently Viewing: <strong className="text-white capitalize">{loadedModelName}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
          >
            Close Studio
          </button>
        </div>

      </div>
    </div>
  );
};
