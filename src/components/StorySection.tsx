import React from 'react';
import { StageModel } from './StageModel';

export const StorySection: React.FC = () => {
  return (
    <section id="news" className="py-16 sm:py-24 bg-paper">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-[clamp(1.75rem,1.4rem+1.6vw,3rem)] font-extrabold text-forest-900 leading-tight">
            How to order
          </h2>
          <ul className="mt-6 space-y-3 text-sm text-forest-700 leading-relaxed">
            <li>Order online or buy in store.</li>
            <li>Pay by EFT, or pay when you collect.</li>
            <li>Courier is R95. Delivery is free on orders over R750.</li>
          </ul>
        </div>
        <div className="hidden lg:block h-[360px]" aria-hidden="true">
          <StageModel model="plant" label="Flowering cannabis plant" className="w-full h-full" />
        </div>
      </div>
    </section>
  );
};
