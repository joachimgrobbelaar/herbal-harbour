import React from 'react';

interface ProductArtworkProps {
  category: string;
  name: string;
  className?: string;
  aspect?: 'square' | 'wide' | 'tall';
  plain?: boolean;
}

const TONE: Record<string, string> = {
  flower: 'from-[#e7f4e3] to-[#c3dbb6]',
  concentrates: 'from-[#fbf4df] to-[#e4c27a]',
  seeds: 'from-[#f7f2e6] to-[#e3d1ab]',
  tinctures: 'from-[#fbf5eb] to-[#f0d3aa]',
  edibles: 'from-[#f4f8ea] to-[#d5e6b8]',
  topicals: 'from-[#f3f7f3] to-[#d2e3d5]',
};

export const ProductArtwork: React.FC<ProductArtworkProps> = ({
  category,
  name,
  className = '',
  plain = false,
}) => {
  // Select distinct botanical styling based on category
  const isOil = category === 'tinctures';
  const isSeed = category === 'seeds';
  const isTopical = category === 'topicals';
  const isEdible = category === 'edibles';
  const isConcentrate = category === 'concentrates';
  const tone = TONE[category] ?? TONE.flower;

  return (
    <div aria-hidden="true" className={`relative overflow-hidden flex items-center justify-center select-none ${plain ? 'bg-transparent' : `bg-gradient-to-br ${tone}`} ${className}`}>
      {!plain && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,_rgba(255,255,255,0.72)_0%,_transparent_68%)] pointer-events-none" />}

      {isOil ? (
        // High fidelity amber dropper bottle with cannabis leaf
        <svg viewBox="0 0 200 200" className="w-4/5 h-4/5 max-h-[170px] drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Shadows */}
          <ellipse cx="100" cy="180" rx="42" ry="7" fill="#000000" fillOpacity="0.08" />
          <ellipse cx="100" cy="180" rx="28" ry="4" fill="#000000" fillOpacity="0.12" />
          
          {/* Cannabis Leaf in background */}
          <g transform="translate(48, 115) scale(0.65)" opacity="0.9">
            {/* Center leaf */}
            <path d="M75 10 C80 35, 78 70, 75 90 C72 70, 70 35, 75 10Z" fill="#2d7756" />
            <path d="M75 10 C77 35, 76 70, 75 90" stroke="#48a87d" strokeWidth="1" />
            {/* Upper side leaves */}
            <path d="M75 90 C85 65, 105 45, 120 35 C102 55, 85 75, 75 90Z" fill="#388c66" />
            <path d="M75 90 C65 65, 45 45, 30 35 C48 55, 65 75, 75 90Z" fill="#388c66" />
            {/* Mid side leaves */}
            <path d="M75 90 C95 80, 125 75, 140 75 C115 88, 90 92, 75 90Z" fill="#256c4d" />
            <path d="M75 90 C55 80, 25 75, 10 75 C35 88, 60 92, 75 90Z" fill="#256c4d" />
            {/* Lower side leaves */}
            <path d="M75 90 C95 100, 115 110, 125 118 C105 114, 88 102, 75 90Z" fill="#1c573d" />
            <path d="M75 90 C55 100, 35 110, 25 118 C45 114, 62 102, 75 90Z" fill="#1c573d" />
          </g>

          {/* Dropper Rubber Bulb */}
          <path d="M92 25 C92 18, 95 12, 100 12 C105 12, 108 18, 108 25 Z" fill="#2b2b2b" />
          
          {/* Dropper Cap Rim */}
          <rect x="88" y="25" width="24" height="18" rx="2" fill="#3a3a3a" />
          <line x1="91" y1="29" x2="91" y2="39" stroke="#555" strokeWidth="1" />
          <line x1="95" y1="29" x2="95" y2="39" stroke="#555" strokeWidth="1" />
          <line x1="100" y1="29" x2="100" y2="39" stroke="#555" strokeWidth="1" />
          <line x1="105" y1="29" x2="105" y2="39" stroke="#555" strokeWidth="1" />
          <line x1="109" y1="29" x2="109" y2="39" stroke="#555" strokeWidth="1" />
          
          {/* White security collar */}
          <rect x="86" y="43" width="28" height="6" rx="1.5" fill="#e8ebe8" stroke="#d0d5d0" strokeWidth="0.5" />

          {/* Amber Glass Bottle Neck */}
          <path d="M90 49 L110 49 L112 60 L88 60 Z" fill="#8c4710" />

          {/* Amber Glass Bottle Shoulder & Body */}
          <path d="M88 60 C80 64, 73 72, 73 85 L73 162 C73 173, 80 178, 100 178 C120 178, 127 173, 127 162 L127 85 C127 72, 120 64, 112 60 Z" fill="url(#amberGlassGrad)" stroke="#683307" strokeWidth="1.2" />
          
          {/* Golden Liquid Level inside */}
          <path d="M74 100 C74 100, 85 99, 100 99 C115 99, 126 100, 126 100 L126 162 C126 172, 118 177, 100 177 C82 177, 74 172, 74 162 Z" fill="url(#goldenLiquidGrad)" opacity="0.88" />

          {/* Apothecary Label on Bottle */}
          <rect x="76" y="98" width="48" height="56" rx="2" fill="#fdfbf7" stroke="#d9ceb9" strokeWidth="0.75" />
          <line x1="82" y1="105" x2="118" y2="105" stroke="#1d4a3b" strokeWidth="1.5" />
          <text x="100" y="116" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#1b4134" fontFamily="sans-serif">HERBAL</text>
          <text x="100" y="123" textAnchor="middle" fontSize="5" fontWeight="600" fill="#2d7756" fontFamily="sans-serif">HARBOUR</text>
          
          {/* Small Cross/Leaf insignia on label */}
          <circle cx="100" cy="132" r="5" fill="#f3eee3" stroke="#2d7756" strokeWidth="0.8" />
          <path d="M100 129 L100 135 M97 132 L103 132" stroke="#2d7756" strokeWidth="1" strokeLinecap="round" />
          
          <text x="100" y="145" textAnchor="middle" fontSize="5" fontWeight="700" fill="#885b1e" fontFamily="sans-serif">CBD 50 OIL</text>
          <text x="100" y="151" textAnchor="middle" fontSize="4" fill="#666" fontFamily="sans-serif">30ml • 1500mg</text>

          {/* Glass specular highlights */}
          <path d="M77 75 L77 165 C77 168, 79 170, 81 170" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />
          <path d="M123 75 L123 165" stroke="#ffffff" strokeWidth="1.2" opacity="0.25" />

          <defs>
            <linearGradient id="amberGlassGrad" x1="73" y1="60" x2="127" y2="178" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#bf6617" />
              <stop offset="35%" stopColor="#873f08" />
              <stop offset="70%" stopColor="#5d2602" />
              <stop offset="100%" stopColor="#3d1800" />
            </linearGradient>
            <linearGradient id="goldenLiquidGrad" x1="100" y1="99" x2="100" y2="177" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f3be3a" />
              <stop offset="60%" stopColor="#c58410" />
              <stop offset="100%" stopColor="#884f04" />
            </linearGradient>
          </defs>
        </svg>
      ) : isSeed ? (
        // Premium cannabis seeds with tiger stripes & seedling leaf
        <svg viewBox="0 0 200 200" className="w-4/5 h-4/5 max-h-[170px] drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Shadow */}
          <ellipse cx="100" cy="155" rx="50" ry="12" fill="#000000" fillOpacity="0.09" />
          
          {/* Seed Pod 1 (Large Center Seed) */}
          <g transform="translate(85, 80) rotate(-18)">
            <ellipse cx="20" cy="30" rx="19" ry="27" fill="#654a33" stroke="#412d1e" strokeWidth="1.5" />
            <path d="M8 20 C14 26, 12 36, 19 46" stroke="#2c1d12" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M22 10 C24 24, 21 38, 28 50" stroke="#2c1d12" strokeWidth="2" strokeLinecap="round" />
            <path d="M30 18 C33 28, 28 40, 31 46" stroke="#2c1d12" strokeWidth="1.8" strokeLinecap="round" />
            {/* Seed Ridge */}
            <path d="M20 3 C20 30, 20 45, 20 57" stroke="#876547" strokeWidth="1" strokeDasharray="2 1" />
            {/* Highlight */}
            <path d="M12 18 C11 26, 13 35, 12 40" stroke="#ffffff" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
          </g>

          {/* Seed Pod 2 (Left tilted seed) */}
          <g transform="translate(50, 95) rotate(35)">
            <ellipse cx="16" cy="24" rx="15" ry="22" fill="#58402c" stroke="#362416" strokeWidth="1.5" />
            <path d="M6 14 C12 20, 11 28, 17 38" stroke="#24170d" strokeWidth="2" strokeLinecap="round" />
            <path d="M18 8 C20 18, 17 28, 23 40" stroke="#24170d" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M10 12 C10 18, 11 25, 10 30" stroke="#ffffff" strokeWidth="1.2" opacity="0.35" strokeLinecap="round" />
          </g>

          {/* Seed Pod 3 (Right foreground seed) */}
          <g transform="translate(112, 105) rotate(-42)">
            <ellipse cx="16" cy="24" rx="16" ry="23" fill="#6b5038" stroke="#463121" strokeWidth="1.5" />
            <path d="M7 15 C13 21, 10 30, 16 38" stroke="#2f1e13" strokeWidth="2" strokeLinecap="round" />
            <path d="M19 9 C20 19, 18 31, 24 39" stroke="#2f1e13" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M11 12 C11 20, 12 28, 11 32" stroke="#ffffff" strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
          </g>

          {/* Small freshly sprouted green leaf */}
          <path d="M100 85 C95 65, 80 50, 68 45 C80 55, 90 70, 100 85Z" fill="#388c66" />
          <path d="M100 85 C108 65, 122 52, 134 48 C120 58, 110 72, 100 85Z" fill="#2d7756" />
          <path d="M100 85 L100 95" stroke="#388c66" strokeWidth="2" strokeLinecap="round" />
          <circle cx="100" cy="85" r="2.5" fill="#44aa75" />
        </svg>
      ) : isTopical ? (
        // Luxury cosmetic balm jar with botanicals
        <svg viewBox="0 0 200 200" className="w-4/5 h-4/5 max-h-[170px] drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="100" cy="170" rx="46" ry="10" fill="#000000" fillOpacity="0.08" />
          {/* Bamboo / Wood Lid */}
          <path d="M60 80 C60 76, 68 72, 100 72 C132 72, 140 76, 140 80 L140 98 C140 102, 132 106, 100 106 C68 106, 60 102, 60 98 Z" fill="#b98851" stroke="#875e30" strokeWidth="1" />
          <ellipse cx="100" cy="80" rx="40" ry="7" fill="#d2a66e" />
          <path d="M68 86 Q100 88 132 86" stroke="#9e6e39" strokeWidth="1" fill="none" />
          <path d="M66 92 Q100 94 134 92" stroke="#9e6e39" strokeWidth="1" fill="none" />
          
          {/* Glass Jar Body */}
          <path d="M62 98 L62 148 C62 160, 72 166, 100 166 C128 166, 138 160, 138 148 L138 98 Z" fill="#f8faf8" stroke="#d5ddd6" strokeWidth="1.2" />
          {/* Cream inside */}
          <path d="M65 110 L65 146 C65 156, 75 162, 100 162 C125 162, 135 156, 135 146 L135 110 Z" fill="#f4ede1" />
          
          {/* Minimalist label */}
          <rect x="74" y="118" width="52" height="32" rx="2" fill="#ffffff" stroke="#e0e0e0" strokeWidth="0.8" />
          <text x="100" y="129" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#1b4134" fontFamily="sans-serif">HERBAL HARBOUR</text>
          <text x="100" y="137" textAnchor="middle" fontSize="5" fontWeight="600" fill="#885b1e" fontFamily="sans-serif">RECOVERY BALM</text>
          <text x="100" y="144" textAnchor="middle" fontSize="4.5" fill="#777" fontFamily="sans-serif">100ml • 1000mg CBD</text>
        </svg>
      ) : isConcentrate ? (
        <svg viewBox="0 0 200 200" className="w-4/5 h-4/5 max-h-[170px] drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="100" cy="168" rx="48" ry="9" fill="#000" fillOpacity="0.08" />
          <path d="M78 58h44c6 0 10 4 10 10v62c0 14-12 26-32 26s-32-12-32-26V68c0-6 4-10 10-10z" fill="#f7f1e6" stroke="#c9b89a" strokeWidth="1.4" />
          <path d="M76 72h48v46c0 12-10 22-24 22s-24-10-24-22V72z" fill="#e7b84a" />
          <path d="M86 84c8 6 16 6 28-2" stroke="#fff4cc" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
          <rect x="86" y="46" width="28" height="14" rx="3" fill="#2c241c" />
          <rect x="92" y="40" width="16" height="10" rx="3" fill="#4a3b2a" />
          <text x="100" y="128" textAnchor="middle" fontSize="7" fontWeight="700" fill="#6a4a12" fontFamily="sans-serif">LIVE ROSIN</text>
        </svg>
      ) : isEdible ? (
        // Fruit gummies with crystallized sugar
        <svg viewBox="0 0 200 200" className="w-4/5 h-4/5 max-h-[170px] drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="100" cy="165" rx="55" ry="12" fill="#000000" fillOpacity="0.08" />
          {/* Gummy 1 - Ruby Raspberry */}
          <g transform="translate(62, 100)">
            <rect x="0" y="0" width="36" height="42" rx="8" fill="#d93856" stroke="#b2203b" strokeWidth="1.2" />
            <rect x="4" y="4" width="28" height="34" rx="6" fill="#f25574" opacity="0.6" />
            <circle cx="10" cy="12" r="1.5" fill="#fff" opacity="0.7" />
            <circle cx="22" cy="18" r="1.2" fill="#fff" opacity="0.6" />
            <circle cx="15" cy="30" r="1.2" fill="#fff" opacity="0.7" />
          </g>
          {/* Gummy 2 - Golden Citrus */}
          <g transform="translate(102, 105)">
            <rect x="0" y="0" width="38" height="40" rx="8" fill="#e59819" stroke="#b77307" strokeWidth="1.2" />
            <rect x="4" y="4" width="30" height="32" rx="6" fill="#ffbe42" opacity="0.7" />
            <circle cx="12" cy="14" r="1.5" fill="#fff" opacity="0.7" />
            <circle cx="26" cy="22" r="1.2" fill="#fff" opacity="0.6" />
          </g>
          {/* Gummy 3 - Emerald Mint */}
          <g transform="translate(80, 75)">
            <rect x="0" y="0" width="38" height="40" rx="8" fill="#258f5b" stroke="#18673f" strokeWidth="1.2" />
            <rect x="4" y="4" width="30" height="32" rx="6" fill="#44b87e" opacity="0.7" />
            <circle cx="14" cy="12" r="1.5" fill="#fff" opacity="0.8" />
            <circle cx="24" cy="26" r="1.2" fill="#fff" opacity="0.6" />
          </g>
        </svg>
      ) : (
        // Craft Cured Cannabis Flower Bud (Tangerine Dream, Durban Poison, Purple Hawaiian Haze)
        <svg viewBox="0 0 200 200" className="w-4/5 h-4/5 max-h-[170px] drop-shadow-lg" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Shadow underneath */}
          <ellipse cx="100" cy="172" rx="46" ry="10" fill="#000000" fillOpacity="0.12" />
          <ellipse cx="100" cy="172" rx="30" ry="6" fill="#000000" fillOpacity="0.16" />

          {/* Organic Calyx clusters with lush botanical shading */}
          <g transform="translate(100, 95)">
            {/* Base calyx layers */}
            <path d="M-42 42 C-55 20, -50 -10, -32 -30 C-22 -45, 0 -68, 8 -68 C16 -68, 38 -45, 46 -30 C60 -10, 58 25, 42 42 C30 55, 0 65, -12 65 C-28 65, -35 55, -42 42 Z" fill="#285a3c" />
            
            {/* Mid Calyx Bumps */}
            <circle cx="-25" cy="22" r="22" fill="#38744e" />
            <circle cx="25" cy="22" r="21" fill="#326c48" />
            <circle cx="0" cy="35" r="24" fill="#3c7d54" />
            <circle cx="-28" cy="-8" r="20" fill="#448b5f" />
            <circle cx="28" cy="-8" r="20" fill="#3d8157" />
            <circle cx="-14" cy="-28" r="19" fill="#4e9969" />
            <circle cx="15" cy="-28" r="19" fill="#489163" />
            <circle cx="2" cy="-48" r="16" fill="#58a876" />
            <circle cx="0" cy="2" r="23" fill="#489063" />

            {/* Deep violet / purple accents for Purple Haze / Exotic lineage */}
            <path d="M-18 8 Q-32 -5 -25 -22 Q-10 -15 -8 5 Z" fill="#69376a" opacity="0.8" />
            <path d="M12 15 Q28 0 22 -18 Q8 -10 10 12 Z" fill="#5f2d60" opacity="0.8" />
            <path d="M-5 -35 Q-15 -42 -2 -52 Q8 -42 2 -32 Z" fill="#753a78" opacity="0.7" />

            {/* Orange & Amber Pistil hairs weaving across the bud */}
            <path d="M-35 15 C-42 5, -38 -15, -28 -25" stroke="#e07718" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M30 20 C42 10, 36 -12, 22 -26" stroke="#ea8223" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M-15 45 C-5 35, 12 40, 28 32" stroke="#d56b0f" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M-18 -10 C-8 -25, 15 -18, 25 -32" stroke="#f08e33" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M-5 -45 C-12 -60, 8 -62, 12 -48" stroke="#d97116" strokeWidth="2" strokeLinecap="round" />
            <path d="M-22 30 C-10 18, 5 22, 12 12" stroke="#f2953e" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M-8 8 C-18 -4, -4 -16, 8 -12" stroke="#ea8223" strokeWidth="2" strokeLinecap="round" />

            {/* Sparkly crystalline trichome dots */}
            <circle cx="-16" cy="18" r="1.5" fill="#ffffff" opacity="0.8" />
            <circle cx="-6" cy="28" r="1.2" fill="#ffffff" opacity="0.9" />
            <circle cx="12" cy="24" r="1.5" fill="#ffffff" opacity="0.75" />
            <circle cx="22" cy="8" r="1.3" fill="#ffffff" opacity="0.85" />
            <circle cx="-20" cy="-6" r="1.6" fill="#ffffff" opacity="0.8" />
            <circle cx="14" cy="-12" r="1.4" fill="#ffffff" opacity="0.75" />
            <circle cx="-4" cy="-22" r="1.5" fill="#ffffff" opacity="0.9" />
            <circle cx="6" cy="-36" r="1.2" fill="#ffffff" opacity="0.8" />
            <circle cx="-1" cy="-4" r="1.8" fill="#ffffff" opacity="0.85" />
            <circle cx="-26" cy="12" r="1.2" fill="#ffe7aa" opacity="0.9" />
            <circle cx="18" cy="-24" r="1.3" fill="#ffe7aa" opacity="0.85" />
          </g>
        </svg>
      )}

    </div>
  );
};
