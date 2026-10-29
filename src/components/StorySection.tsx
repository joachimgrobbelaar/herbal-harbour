import React from 'react';
import { CreditCard, ShoppingBasket, Truck } from 'lucide-react';

const STEPS = [
  { n: '01', title: 'Choose', body: 'Order online or buy in store.', Icon: ShoppingBasket },
  { n: '02', title: 'Pay', body: 'Pay by EFT, or pay when you collect.', Icon: CreditCard },
  { n: '03', title: 'Delivery', body: 'Courier is R95. Free on orders over R750.', Icon: Truck },
];

export const StorySection: React.FC = () => {
  return (
    <section id="news" className="bg-white border-y border-forest-900/10">
      <div className="page-wrap py-12 sm:py-14 max-w-5xl">
        <div className="text-center">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-forest-700">Ordering</p>
          <h2 className="mt-2 text-[clamp(1.75rem,1.4rem+1.6vw,2.75rem)] font-extrabold text-forest-900 leading-tight">
            How to order
          </h2>
        </div>
        <ol className="mt-8 grid sm:grid-cols-3 gap-4 sm:gap-5">
          {STEPS.map(({ n, title, body, Icon }) => (
            <li key={n} className="rounded-3xl bg-paper p-6 sm:p-7 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="w-12 h-12 rounded-full bg-forest-900 text-signal grid place-items-center" aria-hidden="true">
                  <Icon className="w-5 h-5" />
                </span>
                <span className="font-mono text-sm font-bold text-forest-700">{n}</span>
              </div>
              <p className="mt-5 text-xl font-extrabold text-forest-900">{title}</p>
              <p className="mt-2 text-base leading-relaxed text-forest-900/80">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};
