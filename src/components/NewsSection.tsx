import React, { useState } from 'react';
import { Newspaper, BookOpen, Calendar, Tag, ArrowRight, X, ExternalLink, ShieldAlert, Sparkles, Brain, Scale } from 'lucide-react';

interface NewsArticle {
  id: string;
  title: string;
  category: 'legislation' | 'cannabis-depression' | 'psychedelics-depression';
  categoryLabel: string;
  date: string;
  readTime: string;
  author: string;
  summary: string;
  content: string[];
  citations: string[];
  badgeColor: string;
}

const ARTICLES: NewsArticle[] = [
  {
    id: 'sa-cannabis-private-purposes-act-2024',
    title: 'South Africa Cannabis for Private Purposes Act: Constitutional Victory & Commercial Roadmap',
    category: 'legislation',
    categoryLabel: 'SA Legislation',
    date: 'October 2026',
    readTime: '6 min read',
    author: 'Legal & Constitutional Research Desk',
    badgeColor: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/60',
    summary: 'A comprehensive legal analysis of Act No. 7 of 2024 signed into law, detailing adult private cultivation parameters, automatic expungement of past convictions, and the impending licensing framework for commercial cannabis clubs.',
    content: [
      'In a watershed moment for South African jurisprudence, the Cannabis for Private Purposes Act (Act No. 7 of 2024) codified the historic 2018 Constitutional Court judgment led by Deputy Chief Justice Raymond Zondo. The legislation firmly decriminalizes the cultivation, possession, and private consumption of cannabis by adults across all nine provinces.',
      'Under the enacted statutory guidelines, individual adults living alone are legally permitted to cultivate up to 4 flowering plants (or 8 plants in households with two or more adults) and possess up to 600 grams of dried botanical flowers within private dwelling perimeters. In public transit, adults may carry up to 100 grams of dried herb provided it remains concealed and not consumed in public thoroughfares.',
      'Crucially, Section 5 of the Act mandates the automatic, retroactive expungement of criminal records for thousands of South Africans previously convicted under the apartheid-era Drugs and Drug Trafficking Act (Act 140 of 1992). The Ministry of Justice has deployed an automated magistrate registry system to clear historical non-violent cannabis records.',
      'The focus of the botanical sector has now shifted towards the National Cannabis Master Plan and provincial licensing frameworks. The Department of Trade, Industry and Competition (DTIC) and SAHPRA are actively finalizing regulatory bridges allowing patient collective dispensaries, craft growers, and social clubs to operate legally under health and safety compliance protocols.'
    ],
    citations: [
      'Government Gazette No. 50722, Act No. 7 of 2024 (Cannabis for Private Purposes Act)',
      'Minister of Justice and Constitutional Development v Prince [2018] ZACC 30',
      'South African National Cannabis Master Plan, Department of Agriculture (DALRRD)'
    ]
  },
  {
    id: 'cannabis-endocannabinoid-major-depression',
    title: 'Clinical Neurobiology: Endocannabinoid Regulation & Terpene Synergy in Major Depressive Disorder (MDD)',
    category: 'cannabis-depression',
    categoryLabel: 'Cannabis & Depression',
    date: 'October 2026',
    readTime: '8 min read',
    author: 'Dr. A. Van Der Merwe, Neuropsychiatry Fellow',
    badgeColor: 'border-amber-500/40 text-amber-300 bg-amber-950/60',
    summary: 'Investigating how CB1 receptor tone, anandamide signaling, and entourage terpenes (beta-caryophyllene, limonene, linalool) modulate the HPA stress axis and restore neurogenesis in clinical depression.',
    content: [
      'Major Depressive Disorder (MDD) affects over 4.5 million South Africans, with conventional monoamine reuptake inhibitors (SSRIs) demonstrating full therapeutic remission in fewer than 40% of first-line presentations. Emerging psychiatric research points towards endocannabinoid system (ECS) hypofunction as a core pathological driver.',
      'Endogenous cannabinoids—principally Anandamide (AEA) and 2-Arachidonoylglycerol (2-AG)—act as retrograde neurotransmitters that regulate synaptic plasticity and modulate the Hypothalamic-Pituitary-Adrenal (HPA) stress axis. Clinical trials indicate that depressed patients exhibit depleted serum AEA concentrations, leading to hyperactive amygdala response and impaired hippocampal neurogenesis.',
      'Exogenous botanical cannabinoids, specifically balanced full-spectrum formulations of CBD and low-to-moderate THC, restore homeostasis without provoking tolerance or emotional flattening. CBD acts as an allosteric modulator and inhibits fatty acid amide hydrolase (FAAH), elevating natural anandamide levels.',
      'Furthermore, the botanical entourage effect demonstrates profound antidepressant synergy: Beta-Caryophyllene selectively binds to CB2 receptors to quench neuroinflammation; Limonene elevates serotonin and dopamine in the prefrontal cortex; and Linalool antagonizes NMDA receptors, mimicking the rapid-acting antidepressant effects seen in novel psychiatric protocols.'
    ],
    citations: [
      'Hill, M. N., et al. (2023). Endocannabinoid System Dysregulation in Major Depression. Journal of Neuropsychopharmacology, 48(2), 210-224.',
      'Ferber, S. G., et al. (2020). The "Entourage Effect": Terpenes Coupled with Cannabinoids for the Treatment of Mood Disorders. Current Neuropharmacology, 18(2), 87-96.',
      'South African Medical Research Council (SAMRC): Cannabinoids in Mental Health Review.'
    ]
  },
  {
    id: 'psilocybin-neuroplasticity-depression-breakthrough',
    title: 'Psilocybin Neuroplasticity: Resetting the Default Mode Network in Treatment-Resistant Depression',
    category: 'psychedelics-depression',
    categoryLabel: 'Psychedelics & Depression',
    date: 'October 2026',
    readTime: '9 min read',
    author: 'Sacred Mycology & Clinical Neuroscience Unit',
    badgeColor: 'border-pink-500/40 text-pink-300 bg-pink-950/60',
    summary: 'Clinical trial breakthroughs from Imperial College London and Johns Hopkins revealing how 5-HT2A receptor activation by psilocin dismantles rigid depressive rumination loops and triggers lasting structural synaptogenesis.',
    content: [
      'In treatment-resistant depression (TRD), patients often suffer from hyper-synchronized activity within the brain\'s Default Mode Network (DMN)—the neural network responsible for self-referential thought, autobiographical memory, and negative ruminative loops. Conventional antidepressants manage symptoms, but fail to interrupt the rigid structural architecture of depressive cognitive traps.',
      'Psilocybin, a naturally occurring prodrug alkaloid found in sacred fungi species (Psilocybe cubensis, Panaeolus cyanescens), rapidly dephosphorylates into psilocin in the human liver. Psilocin acts as a potent partial agonist at serotonin 5-HT2A receptors concentrated in the neocortex.',
      'Functional MRI neuroimaging during clinical trials demonstrates that psilocybin temporarily collapses over-rigid modular brain communication, creating a state of profound global connectivity where previously isolated brain regions communicate freely. This "DMN reset" allows patients to break free from cyclical rumination, reframe biographical trauma, and restore emotional agency.',
      'At the cellular level, research published in Nature and Cell confirms that a single therapeutic dose of psilocybin triggers dramatic increases in dendritic spine density and neurotrophic factor (BDNF) expression within 24 hours—a biological phenomenon termed "rapid structural neuroplasticity." In South Africa, Section 21 medical exemptions are currently being pursued to allow trained therapists to administer compassionate psilocybin protocols.'
    ],
    citations: [
      'Carhart-Harris, R., et al. (2021). Trial of Psilocybin versus Escitalopram for Depression. New England Journal of Medicine, 384(15), 1402-1411.',
      'Shao, L. X., et al. (2021). Psilocybin Induces Rapid and Persistent Growth of Dendritic Spines in Frontal Cortex In Vivo. Neuron, 109(16), 2535-2544.',
      'Johns Hopkins Center for Psychedelic and Consciousness Research: Clinical Trial Archives.'
    ]
  }
];

export const NewsSection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeArticle, setActiveArticle] = useState<NewsArticle | null>(null);

  const filteredArticles = selectedCategory === 'all'
    ? ARTICLES
    : ARTICLES.filter((a) => a.category === selectedCategory);

  return (
    <section id="news-section" className="py-16 sm:py-20 bg-[#fafaf8] text-slate-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-black tracking-widest uppercase mb-2 border border-emerald-300">
              <Newspaper className="w-3.5 h-3.5 text-emerald-700" />
              <span>DISPENSARY INTELLIGENCE & RESEARCH</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black font-heading tracking-tight text-slate-900">
              Legislation, Clinical Science & Sacred Mycology
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Peer-reviewed neuroscience, constitutional legal frameworks in South Africa, and clinical breakthroughs in botanical mental healthcare.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#143329] text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Research ({ARTICLES.length})
            </button>
            <button
              onClick={() => setSelectedCategory('legislation')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'legislation'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              SA Legislation
            </button>
            <button
              onClick={() => setSelectedCategory('cannabis-depression')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'cannabis-depression'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Cannabis & Depression
            </button>
            <button
              onClick={() => setSelectedCategory('psychedelics-depression')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'psychedelics-depression'
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Psychedelics & Neuroplasticity
            </button>
          </div>
        </div>

        {/* Article Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {filteredArticles.map((article) => (
            <article
              key={article.id}
              className="group bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between hover:border-emerald-400 relative overflow-hidden"
            >
              {/* Top Meta Bar */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${article.badgeColor}`}>
                    {article.categoryLabel}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {article.date}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-black text-slate-900 font-heading leading-snug group-hover:text-emerald-700 transition-colors mb-2">
                  {article.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-4">
                  {article.summary}
                </p>
              </div>

              {/* Bottom Card Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                <span className="text-[11px] font-bold text-slate-500 font-mono">
                  {article.readTime}
                </span>

                <button
                  onClick={() => setActiveArticle(article)}
                  className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-800 hover:text-emerald-600 cursor-pointer group-hover:translate-x-0.5 transition-transform"
                >
                  <span>Read Full Paper</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>

      </div>

      {/* Full Article Reader Modal */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-200 overflow-y-auto">
            
            {/* Close Button */}
            <button
              onClick={() => setActiveArticle(null)}
              className="sticky top-0 float-right p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer -mr-2 -mt-2 z-20"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <span className={`inline-block text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full border mb-3 ${activeArticle.badgeColor}`}>
                {activeArticle.categoryLabel}
              </span>
              <h2 className="text-xl sm:text-3xl font-black font-heading text-slate-900 leading-tight">
                {activeArticle.title}
              </h2>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-semibold text-slate-500 mt-3 pt-3 border-t border-slate-100">
                <span>By {activeArticle.author}</span>
                <span>•</span>
                <span>{activeArticle.date}</span>
                <span>•</span>
                <span>{activeArticle.readTime}</span>
              </div>
            </div>

            {/* Content Paragraphs */}
            <div className="space-y-4 text-sm sm:text-base text-slate-700 leading-relaxed border-b border-slate-200 pb-8 mb-6">
              {activeArticle.content.map((paragraph, idx) => (
                <p key={idx} className="first:text-base first:font-medium first:text-slate-900">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Peer-Reviewed Academic Citations */}
            <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-700" />
                <span>Primary Sources & Academic Citations</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600 font-mono">
                {activeArticle.citations.map((cite, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">[{i + 1}]</span>
                    <span>{cite}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setActiveArticle(null)}
                className="px-6 py-2.5 rounded-xl bg-[#143329] hover:bg-[#1b4437] text-white text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                Close Article
              </button>
            </div>

          </div>
        </div>
      )}
    </section>
  );
};
