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
  className?: string;
  interactive?: boolean;
  label?: string;
}

/** Lazy 3D preset. Phones, low-power devices, and reduced motion get a still illustration. */
export const StageModel: React.FC<StageModelProps> = ({ model, className = '', interactive = false, label = 'Product' }) => {
  if (!canUseWebGL()) {
    return (
      <div className={`bg-paper ${className}`} aria-hidden="true">
        <ProductArtwork category={ART[model]} name={label} className="w-full h-full" />
      </div>
    );
  }
  return (
    <Suspense fallback={<div className={`bg-paper ${className}`} aria-hidden="true" />}>
      <ThreeCanvas
        key={model}
        initialModel={model}
        modelUrls={[`/models/${model}.glb`]}
        presentation={!interactive}
        allowUpload={false}
        autoRotate
        className={`h-full min-h-0 border-0 shadow-none bg-transparent ${className}`}
      />
    </Suspense>
  );
};
