import React, { Suspense, lazy } from 'react';
import type { ModelType } from './ThreeCanvas';
import { ProductArtwork } from './ProductArtwork';
import { canUseWebGL } from '../lib/display';

const ThreeCanvas = lazy(() => import('./ThreeCanvas').then((mod) => ({ default: mod.ThreeCanvas })));

const ART: Record<ModelType, string> = {
  bud: 'flower',
  leaf: 'topicals',
  plant: 'flower',
  bottle: 'tinctures',
  seed: 'seeds',
  custom: 'flower',
};

interface StageModelProps {
  model: ModelType;
  src?: string;
  className?: string;
  interactive?: boolean;
  label?: string;
}

/** Lazy 3D preset. Phones, low-power devices, and reduced motion get a still illustration. */
export const StageModel: React.FC<StageModelProps> = ({ model, src, className = '', interactive = false, label = 'Product' }) => {
  if (!canUseWebGL()) {
    return (
      <div className={`bg-transparent ${className}`} aria-hidden="true">
        <ProductArtwork plain category={ART[model]} name={label} className="w-full h-full bg-transparent" />
      </div>
    );
  }
  return (
    <Suspense fallback={<ProductArtwork plain category={ART[model]} name={label} className={`bg-transparent ${className}`} />}>
      <ThreeCanvas
        key={model}
        initialModel={model}
        modelUrls={[src ?? `/models/${model}.glb`]}
        presentation={!interactive}
        allowUpload={false}
        autoRotate
        className={`h-full min-h-0 border-0 shadow-none bg-transparent ${className}`}
      />
    </Suspense>
  );
};
