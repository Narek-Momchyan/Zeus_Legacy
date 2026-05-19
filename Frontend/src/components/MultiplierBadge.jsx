import React from 'react';
import { motion } from 'framer-motion';

const MultiplierBadge = ({ multiplier, className = '' }) => {
  const color = multiplier >= 50 ? '#ff3050'
    : multiplier >= 10 ? '#ff8c00'
    : multiplier >= 5  ? '#b06eff'
    : '#00d4ff';

  return (
    <motion.div
      initial={{ scale: 0, x: -20, opacity: 0 }}
      animate={{ scale: 1, x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 240, damping: 18 }}
      className={className}
      style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {/* Ambient glow behind badge */}
      <div style={{
        position: 'absolute', inset: -4, borderRadius: '9999px',
        background: color, opacity: 0.15, filter: 'blur(8px)',
      }} />

      {/* Badge */}
      <div className="multiplier-badge" style={{
        position: 'relative',
        background: `linear-gradient(135deg, ${color}22, ${color}44)`,
        border: `1px solid ${color}88`,
        borderRadius: '9999px',
        padding: '6px 14px',
        display: 'flex', alignItems: 'center', gap: 4,
        boxShadow: `0 0 12px ${color}44, inset 0 1px 0 rgba(255,255,255,0.1)`,
      }}>
        <span
          className="multiplier-badge-text"
          style={{
            fontFamily: "'Outfit', monospace",
            fontWeight: 900,
            letterSpacing: '-0.02em', fontStyle: 'italic',
            color: color,
            filter: `drop-shadow(0 0 6px ${color})`,
          }}
        >
          ×{multiplier}
        </span>
        <motion.span
          className="multiplier-badge-star"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          style={{ lineHeight: 1 }}
        >✦</motion.span>
      </div>
    </motion.div>
  );
};

export default MultiplierBadge;
