import React from 'react';

// Import all generated assets
import imgTrident from '../assets/symbols/sym_trident.png';
import imgPegasus from '../assets/symbols/sym_pegasus.png';
import imgShield from '../assets/symbols/sym_shield.png';
import imgChalice from '../assets/symbols/sym_chalice.png';
import imgRedStone from '../assets/symbols/sym_red_stone.png';
import imgPurpleStone from '../assets/symbols/sym_purple_stone.png';
import imgYellowStone from '../assets/symbols/sym_yellow_stone.png';
import imgGreenStone from '../assets/symbols/sym_green_stone.png';
import imgBlueStone from '../assets/symbols/sym_blue_stone.png';
import imgScatter from '../assets/symbols/sym_scatter.png';

const SYMBOL_ASSETS = {
  crown: imgTrident,
  hourglass: imgPegasus,
  ring: imgShield,
  cup: imgChalice,
  red_gem: imgRedStone,
  purple_gem: imgPurpleStone,
  yellow_gem: imgYellowStone,
  green_gem: imgGreenStone,
  blue_gem: imgBlueStone,
  scatter: imgScatter
};

const Symbol = ({ id, uid = 'x', className = '' }) => {
  const [customSrc, setCustomSrc] = React.useState(
    typeof window !== 'undefined' && window.customSymbolImages ? window.customSymbolImages[id] : null
  );

  React.useEffect(() => {
    const handleLoaded = () => {
      if (typeof window !== 'undefined' && window.customSymbolImages) {
        setCustomSrc(window.customSymbolImages[id] || null);
      }
    };
    
    handleLoaded();

    window.addEventListener('gameConfigLoaded', handleLoaded);
    return () => window.removeEventListener('gameConfigLoaded', handleLoaded);
  }, [id]);

  // ── MULTIPLIERS (SVG) ──
  if (id === 'mult_2')   return <div className="w-full h-full p-[6%]"><MultiplierSymbol value="x2"   color="#00cfff" uid={uid} /></div>;
  if (id === 'mult_5')   return <div className="w-full h-full p-[6%]"><MultiplierSymbol value="x5"   color="#a855f7" uid={uid} /></div>;
  if (id === 'mult_10')  return <div className="w-full h-full p-[6%]"><MultiplierSymbol value="x10"  color="#f97316" uid={uid} /></div>;
  if (id === 'mult_25')  return <div className="w-full h-full p-[6%]"><MultiplierSymbol value="x25"  color="#10b981" uid={uid} /></div>;
  if (id === 'mult_50')  return <div className="w-full h-full p-[6%]"><MultiplierSymbol value="x50"  color="#ef4444" uid={uid} /></div>;
  if (id === 'mult_100') return <div className="w-full h-full p-[6%]"><MultiplierSymbol value="x100" color="#ec4899" uid={uid} /></div>;
  if (id === 'mult_250') return <div className="w-full h-full p-[6%]"><MultiplierSymbol value="x250" color="#8b5cf6" uid={uid} /></div>;
  if (id === 'mult_500') return <div className="w-full h-full p-[6%]"><MultiplierSymbol value="x500" color="#facc15" uid={uid} /></div>;

  // ── PREMIUM IMAGE ASSETS ──
  const asset = customSrc || SYMBOL_ASSETS[id];
  
  if (asset) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
         <img 
            src={asset.src || asset} 
            alt={id} 
            style={{
              width: '120%', // Slightly larger to compensate for transparent padding in images
              height: '120%',
              objectFit: 'contain',
              mixBlendMode: 'screen', // Magic trick to remove the black background!
              filter: id === 'scatter' ? 'drop-shadow(0 0 10px rgba(255,215,0,0.6))' : 'drop-shadow(0 0 5px rgba(255,255,255,0.15))'
            }}
            className={className}
         />
      </div>
    );
  }

  // ── FALLBACK ──
  return (
    <div style={{ width: '100%', height: '100%', padding: '6%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className={`w-full h-full rounded-full bg-gray-700 flex items-center justify-center text-xs text-white font-bold ${className}`}>
        {id}
      </div>
    </div>
  );
};

/* ── Multiplier symbol (Kept unchanged because it has dynamic text) ───────────────── */
const MultiplierSymbol = ({ value, color, uid }) => {
  const mgId = `mg-${uid}`;
  const mfId = `mf-${uid}`;
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <radialGradient id={mgId} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#fff" stopOpacity="0.95" />
          <stop offset="100%" stopColor={color} />
        </radialGradient>
        <filter id={mfId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer glow ring */}
      <circle cx="50" cy="50" r="44" fill={color} opacity="0.10" />
      {/* Main ring */}
      <circle cx="50" cy="50" r="40" fill="none"
        stroke={color} strokeWidth="3" opacity="0.9" />
      {/* Inner subtle fill */}
      <circle cx="50" cy="50" r="37" fill={`url(#${mgId})`} opacity="0.08" />

      {/* Value text */}
      <text
        x="50" y="59"
        textAnchor="middle"
        fontSize={value.length > 2 ? '25' : '30'}
        fontWeight="900"
        fontFamily="'Outfit', monospace"
        fill={color}
        filter={`url(#${mfId})`}
      >
        {value}
      </text>

      {/* Subtle rotating sparkle dots */}
      <g opacity="0.6">
        <circle cx="50" cy="8" r="2.5" fill={color}>
          <animateTransform attributeName="transform" type="rotate"
            from="0 50 50" to="360 50 50" dur="3s" repeatCount="indefinite" />
        </circle>
      </g>
    </svg>
  );
};

export default Symbol;
