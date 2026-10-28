import React from 'react';
import { StageModel } from './StageModel';
import { ProductArtwork } from './ProductArtwork';

const STEPS = [
  { n: '01', title: 'Choose', body: 'Order online or buy in store.' },
  { n: '02', title: 'Pay', body: 'Pay by EFT, or pay when you collect.' },
  { n: '03', title: 'Delivery', body: 'Courier is R95. Free on orders over R750.' },
];

export const StorySection: React.FC = () => {
  return (
    <section id="news" className="bg-white border-y border-forest-900/10">
      <div className="page-wrap py-12 sm:py-16 grid lg:grid-cols-[1.15fr_0.85fr] gap-8 lg:gap-12 items-center">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-forest-700">Ordering</p>
          <h2 className="mt-2 text-[clamp(1.75rem,1.4rem+1.6vw,2.75rem)] font-extrabold text-forest-900 leading-tight">
            How to order
          </h2>
          <ol className="mt-8 grid sm:grid-cols-3 gap-3">
            {STEPS.map((step) => (
              <li key={step.n} className="rounded-2xl bg-paper p-4">
                <span className="font-mono text-xs text-forest-700">{step.n}</span>
                <p className="mt-2 font-extrabold text-forest-900">{step.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-forest-700">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="relative h-64 sm:h-80 rounded-[28px] bg-[#e7f0e4] overflow-hidden" aria-hidden="true">
          <ProductArtwork plain category="flower" name="Flowering plant" className="absolute inset-0 bg-transparent" />
          <StageModel model="plant" label="Flowering cannabis plant" className="absolute inset-0" />
        </div>
      </div>
    </section>
  );
};
