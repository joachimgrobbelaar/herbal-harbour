import React, { useEffect, useRef, useState } from 'react';
import { CreditCard, ShoppingBasket, Truck, ShieldCheck } from 'lucide-react';

const STEPS = [
  { n: '01', title: 'Choose', body: 'Browse lab-certified craft flower, medicinal seeds, and CBD tinctures online or visit in store.', Icon: ShoppingBasket },
  { n: '02', title: 'Pay', body: 'Pay securely via Instant EFT, digital wallet credit, or pay on collection.', Icon: CreditCard },
  { n: '03', title: 'Delivery', body: 'Discreet door-to-door courier nationwide (R95, or free on orders over R750).', Icon: Truck },
];

export const StorySection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.15 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="news" className="bg-white border-y border-forest-900/10 transition-colors">
      <div className={`page-wrap py-16 sm:py-20 lg:py-24 max-w-5xl transition-all duration-700 ease-out transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}>
        <div className="text-center max-w-2xl mx-auto">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-forest-700 font-bold">Simple Dispensary Ordering</p>
          <h2 className="mt-2 text-[clamp(2rem,1.6rem+1.8vw,3rem)] font-extrabold text-forest-900 leading-tight">
            How to order
          </h2>
          <p className="mt-3 text-base text-forest-900/80 leading-relaxed">
            Straightforward medical cannabis and CBD access across South Africa with full batch tracking.
          </p>
        </div>

        <ol className="mt-12 grid sm:grid-cols-3 gap-5 sm:gap-6">
          {STEPS.map(({ n, title, body, Icon }, idx) => (
            <li
              key={n}
              style={{ transitionDelay: `${idx * 120}ms` }}
              className={`rounded-3xl bg-paper p-6 sm:p-8 flex flex-col border border-forest-900/5 shadow-xs transition-all duration-500 hover:shadow-md hover:-translate-y-1 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="w-12 h-12 rounded-2xl bg-forest-900 text-signal grid place-items-center shadow-xs" aria-hidden="true">
                  <Icon className="w-5 h-5" />
                </span>
                <span className="font-mono text-sm font-extrabold text-forest-700/80">{n}</span>
              </div>
              <p className="mt-6 text-xl font-extrabold text-forest-900">{title}</p>
              <p className="mt-2 text-sm sm:text-base leading-relaxed text-forest-900/80">{body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10 rounded-2xl bg-emerald-50/70 border border-emerald-900/10 p-4 sm:p-5 flex items-center justify-center gap-3 text-xs sm:text-sm text-forest-900 font-medium text-center">
          <ShieldCheck className="w-5 h-5 text-forest-700 shrink-0" />
          <span>All packages are sealed in smell-proof, tamper-evident pharmaceutical packaging for total privacy.</span>
        </div>
      </div>
    </section>
  );
};
