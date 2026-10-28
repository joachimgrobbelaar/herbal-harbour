import React from 'react';

interface CannabisLeafIconProps {
  className?: string;
  size?: number;
  showVeins?: boolean;
}

export const CannabisLeafIcon: React.FC<CannabisLeafIconProps> = ({
  className = 'w-6 h-6',
  size,
  showVeins = true
}) => {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 
        Authentic 7-leaflet serrated Cannabis Sativa/Indica fan leaf
        Features: Distinct saw-tooth serrations on every blade, tapered lanceolate leaflets, 
        central radiating petiole base, and subtle botanical inner vein structure.
      */}
      <g transform="translate(60, 92)">
        {/* Main Petiole (Stem) */}
        <path
          d="M-1.5 0 C-1.5 8, -2 18, -2.5 24 C-2.5 25.5, 2.5 25.5, 2.5 24 C2 18, 1.5 8, 1.5 0 Z"
          fill="currentColor"
        />

        {/* 1. Center Leaflet (Tallest, perfectly vertical with distinct jagged serrations) */}
        <path
          d="M0 -86
             L3 -76 L1 -75 L4.5 -66 L2.2 -65 L6.5 -55 L3.5 -54 L7.8 -43 L4.5 -42 L8.2 -30 L4.8 -29 L7.5 -17 L3.5 -16 L5.5 -5 L0 0
             L-5.5 -5 L-3.5 -16 L-7.5 -17 L-4.8 -29 L-8.2 -30 L-4.5 -42 L-7.8 -43 L-3.5 -54 L-6.5 -55 L-2.2 -65 L-4.5 -66 L-1 -75 L-3 -76 Z"
        />

        {/* 2. Upper-Right Leaflet (Tilted ~28 degrees) */}
        <g transform="rotate(27)">
          <path
            d="M0 -74
               L3 -65 L1.2 -64 L4.2 -56 L2 -55 L6 -46 L3.2 -45 L7.2 -36 L4 -35 L7.5 -25 L4.2 -24 L6.5 -14 L2.8 -13 L4.5 -4 L0 0
               L-4.5 -4 L-2.8 -13 L-6.5 -14 L-4.2 -24 L-7.5 -25 L-4 -35 L-7.2 -36 L-3.2 -45 L-6 -46 L-2 -55 L-4.2 -56 L-1.2 -64 L-3 -65 Z"
          />
        </g>

        {/* 3. Upper-Left Leaflet (Tilted -27 degrees) */}
        <g transform="rotate(-27)">
          <path
            d="M0 -74
               L3 -65 L1.2 -64 L4.2 -56 L2 -55 L6 -46 L3.2 -45 L7.2 -36 L4 -35 L7.5 -25 L4.2 -24 L6.5 -14 L2.8 -13 L4.5 -4 L0 0
               L-4.5 -4 L-2.8 -13 L-6.5 -14 L-4.2 -24 L-7.5 -25 L-4 -35 L-7.2 -36 L-3.2 -45 L-6 -46 L-2 -55 L-4.2 -56 L-1.2 -64 L-3 -65 Z"
          />
        </g>

        {/* 4. Mid-Right Leaflet (Tilted ~54 degrees) */}
        <g transform="rotate(55)">
          <path
            d="M0 -58
               L2.8 -51 L1 -50 L3.8 -43 L1.6 -42 L5.2 -35 L2.5 -34 L5.8 -27 L2.8 -26 L5.8 -18 L2.5 -17 L4.5 -9 L1.5 -8 L3.5 -3 L0 0
               L-3.5 -3 L-1.5 -8 L-4.5 -9 L-2.5 -17 L-5.8 -18 L-2.8 -26 L-5.8 -27 L-2.5 -34 L-5.2 -35 L-1.6 -42 L-3.8 -43 L-1 -50 L-2.8 -51 Z"
          />
        </g>

        {/* 5. Mid-Left Leaflet (Tilted -55 degrees) */}
        <g transform="rotate(-55)">
          <path
            d="M0 -58
               L2.8 -51 L1 -50 L3.8 -43 L1.6 -42 L5.2 -35 L2.5 -34 L5.8 -27 L2.8 -26 L5.8 -18 L2.5 -17 L4.5 -9 L1.5 -8 L3.5 -3 L0 0
               L-3.5 -3 L-1.5 -8 L-4.5 -9 L-2.5 -17 L-5.8 -18 L-2.8 -26 L-5.8 -27 L-2.5 -34 L-5.2 -35 L-1.6 -42 L-3.8 -43 L-1 -50 L-2.8 -51 Z"
          />
        </g>

        {/* 6. Lower-Right Leaflet (Tilted ~80 degrees) */}
        <g transform="rotate(82)">
          <path
            d="M0 -38
               L2.2 -33 L0.8 -32 L3 -27 L1.2 -26 L4 -21 L1.8 -20 L4.2 -14 L1.8 -13 L3.5 -7 L1.2 -6 L2.2 -2 L0 0
               L-2.2 -2 L-1.2 -6 L-3.5 -7 L-1.8 -13 L-4.2 -14 L-1.8 -20 L-4 -21 L-1.2 -26 L-3 -27 L-0.8 -32 L-2.2 -33 Z"
          />
        </g>

        {/* 7. Lower-Left Leaflet (Tilted -82 degrees) */}
        <g transform="rotate(-82)">
          <path
            d="M0 -38
               L2.2 -33 L0.8 -32 L3 -27 L1.2 -26 L4 -21 L1.8 -20 L4.2 -14 L1.8 -13 L3.5 -7 L1.2 -6 L2.2 -2 L0 0
               L-2.2 -2 L-1.2 -6 L-3.5 -7 L-1.8 -13 L-4.2 -14 L-1.8 -20 L-4 -21 L-1.2 -26 L-3 -27 L-0.8 -32 L-2.2 -33 Z"
          />
        </g>

        {/* Subtle Botanical Vein Lines (Light translucent contrast) */}
        {showVeins && (
          <g stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round" opacity="0.35">
            {/* Center vein */}
            <line x1="0" y1="0" x2="0" y2="-75" />
            <line x1="0" y1="-30" x2="4" y2="-38" />
            <line x1="0" y1="-30" x2="-4" y2="-38" />
            <line x1="0" y1="-45" x2="3.5" y2="-52" />
            <line x1="0" y1="-45" x2="-3.5" y2="-52" />
            <line x1="0" y1="-60" x2="2.5" y2="-65" />
            <line x1="0" y1="-60" x2="-2.5" y2="-65" />

            {/* Upper Right vein */}
            <g transform="rotate(27)">
              <line x1="0" y1="0" x2="0" y2="-64" />
              <line x1="0" y1="-25" x2="3.5" y2="-32" />
              <line x1="0" y1="-25" x2="-3.5" y2="-32" />
              <line x1="0" y1="-42" x2="3" y2="-48" />
              <line x1="0" y1="-42" x2="-3" y2="-48" />
            </g>

            {/* Upper Left vein */}
            <g transform="rotate(-27)">
              <line x1="0" y1="0" x2="0" y2="-64" />
              <line x1="0" y1="-25" x2="3.5" y2="-32" />
              <line x1="0" y1="-25" x2="-3.5" y2="-32" />
              <line x1="0" y1="-42" x2="3" y2="-48" />
              <line x1="0" y1="-42" x2="-3" y2="-48" />
            </g>

            {/* Mid Right vein */}
            <g transform="rotate(55)">
              <line x1="0" y1="0" x2="0" y2="-48" />
            </g>

            {/* Mid Left vein */}
            <g transform="rotate(-55)">
              <line x1="0" y1="0" x2="0" y2="-48" />
            </g>
          </g>
        )}
      </g>
    </svg>
  );
};
