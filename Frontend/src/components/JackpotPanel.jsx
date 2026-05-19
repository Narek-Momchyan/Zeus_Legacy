import React from 'react';
import { motion } from 'framer-motion';

const TIERS = [
  { key: 'grand', label: 'GRAND', color: '#facc15', glow: 'rgba(250,204,21,0.6)', size: 'clamp(0.78rem, 2.2vw, 1.15rem)' },
  { key: 'major', label: 'MAJOR', color: '#ef4444', glow: 'rgba(239,68,68,0.5)', size: 'clamp(0.72rem, 1.9vw, 1.0rem)' },
  { key: 'minor', label: 'MINOR', color: '#a855f7', glow: 'rgba(168,85,247,0.4)', size: 'clamp(0.66rem, 1.7vw, 0.9rem)' },
  { key: 'mini',  label: 'MINI',  color: '#60a5fa', glow: 'rgba(96,165,250,0.3)', size: 'clamp(0.6rem, 1.5vw, 0.82rem)' },
];

const JackpotPanel = ({ pools }) => {
  return (
    <div className="jackpot-panel-container">
      {TIERS.map(tier => (
        <motion.div
          key={tier.key}
          animate={{ boxShadow: [`0 0 6px ${tier.glow}`, `0 0 18px ${tier.glow}`, `0 0 6px ${tier.glow}`] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            padding: 'clamp(3px, 0.6vw, 6px) clamp(2px, 0.5vw, 6px)',
            borderRadius: 'clamp(6px, 1vw, 10px)',
            border: `1px solid ${tier.color}30`,
            background: `${tier.color}08`,
            minWidth: 0, // Enable scaling and flex-shrink
          }}
        >
          <span style={{
            fontSize: 'clamp(0.48rem, 1.1vw, 0.58rem)',
            fontWeight: 900,
            letterSpacing: '0.1em',
            color: tier.color,
            textTransform: 'uppercase',
            opacity: 0.8,
            whiteSpace: 'nowrap',
          }}>{tier.label}</span>
          <motion.span
            key={pools[tier.key]}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            style={{
              fontSize: tier.size,
              fontWeight: 900,
              color: '#fff',
              fontFamily: "'Outfit', monospace",
              textShadow: `0 0 12px ${tier.glow}`,
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
            }}
          >
            ${(pools[tier.key] || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </motion.span>
        </motion.div>
      ))}
    </div>
  );
};

export default JackpotPanel;
