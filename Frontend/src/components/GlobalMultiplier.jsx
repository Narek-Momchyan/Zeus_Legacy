import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const GlobalMultiplier = ({ value, isBonusMode }) => {
  if (!isBonusMode && value <= 1) return null;

  // Colors & Gradients based on mode
  const accentColor = isBonusMode ? '#c87fff' : '#f5d060';
  const shadowColor = isBonusMode ? 'rgba(168, 85, 247, 0.4)' : 'rgba(245, 208, 60, 0.3)';
  const borderGradient = isBonusMode 
    ? 'rgba(168, 85, 247, 0.45)' 
    : 'rgba(245, 208, 60, 0.35)';

  return (
    <motion.div
      className="global-multiplier-wrap"
      initial={{ x: -100, opacity: 0, scale: 0.9 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={{ x: -100, opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
    >
      <div style={{ position: 'relative' }}>
        {/* Divine Ambient Glow Background */}
        <motion.div
          animate={{ 
            scale: [1, 1.15, 1],
            opacity: [0.35, 0.6, 0.35]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: 'absolute',
            inset: -15,
            background: isBonusMode
              ? 'radial-gradient(circle, rgba(168,85,247,0.3) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(245,208,60,0.25) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
            filter: 'blur(8px)'
          }}
        />

        {/* Main Glass Panel */}
        <div
          style={{
            position: 'relative',
            padding: '16px 26px',
            background: 'linear-gradient(135deg, rgba(20, 10, 35, 0.85) 0%, rgba(10, 5, 20, 0.95) 100%)',
            backdropFilter: 'blur(20px) saturate(1.5)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.5)',
            border: `1px solid ${borderGradient}`,
            borderRadius: '20px',
            boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.6), 0 0 20px ${shadowColor}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            minWidth: '120px',
            borderTop: `1.5px solid ${isBonusMode ? 'rgba(200, 140, 255, 0.6)' : 'rgba(255, 248, 176, 0.5)'}`, // Highlight on top
          }}
        >
          {/* Label */}
          <span 
            className="font-cinzel"
            style={{ 
              fontSize: '10px',
              fontWeight: 900,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: isBonusMode ? '#e9d5ff' : '#fff8b0',
              opacity: 0.8,
              textShadow: `0 0 6px ${isBonusMode ? 'rgba(168,85,247,0.4)' : 'rgba(245,208,60,0.3)'}`
            }}
          >
            Multiplier
          </span>

          {/* Value Display */}
          <AnimatePresence mode="wait">
            <motion.div
              key={value}
              initial={{ scale: 1.8, opacity: 0, y: -5 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.6, opacity: 0, y: 5 }}
              transition={{ type: 'spring', stiffness: 350, damping: 18 }}
              style={{
                fontFamily: "'Outfit', monospace",
                fontSize: '2.8rem',
                fontWeight: 900,
                letterSpacing: '-0.04em',
                fontStyle: 'italic',
                lineHeight: 0.95,
                margin: '2px 0',
                ...(isBonusMode
                  ? { 
                      color: '#c87fff', 
                      filter: 'drop-shadow(0 0 16px rgba(168,85,247,0.95)) drop-shadow(0 0 6px rgba(255,255,255,0.8))' 
                    }
                  : {
                      background: 'linear-gradient(135deg, #ffffff 10%, #fff8b0 35%, #f5d060 70%, #d4a012 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      filter: 'drop-shadow(0 0 12px rgba(245,208,60,0.75))',
                    }
                ),
              }}
            >
              ×{value}
            </motion.div>
          </AnimatePresence>

          {/* Glowing Custom SVG Lightning Bolt */}
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              filter: [
                `drop-shadow(0 0 6px ${accentColor})`,
                `drop-shadow(0 0 16px ${accentColor})`,
                `drop-shadow(0 0 6px ${accentColor})`
              ]
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginTop: 2
            }}
          >
            <svg 
              width="18" 
              height="22" 
              viewBox="0 0 24 30" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M15 2L3 16H12L9 28L21 14H12L15 2Z" 
                fill={`url(#bolt-gradient-${isBonusMode ? 'bonus' : 'normal'})`}
                stroke={isBonusMode ? '#f5f0ff' : '#fffbe8'} 
                strokeWidth="1.2" 
                strokeLinejoin="round"
              />
              <defs>
                {isBonusMode ? (
                  <linearGradient id="bolt-gradient-bonus" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="40%" stopColor="#d8b4fe" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                ) : (
                  <linearGradient id="bolt-gradient-normal" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="40%" stopColor="#fff38a" />
                    <stop offset="100%" stopColor="#f5d060" />
                  </linearGradient>
                )}
              </defs>
            </svg>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default GlobalMultiplier;
