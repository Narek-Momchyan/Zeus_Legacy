import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TIER_CONFIG = {
  GRAND: { color: '#facc15', emoji: '👑', label: 'GRAND JACKPOT' },
  MAJOR: { color: '#ef4444', emoji: '🔥', label: 'MAJOR JACKPOT' },
  MINOR: { color: '#a855f7', emoji: '💜', label: 'MINOR JACKPOT' },
  MINI:  { color: '#60a5fa', emoji: '⭐', label: 'MINI JACKPOT' },
};

const JackpotWinOverlay = ({ jackpotWon, onClose }) => {
  const [displayAmount, setDisplayAmount] = useState(0);
  const cfg = TIER_CONFIG[jackpotWon?.tier] || TIER_CONFIG.MINI;

  useEffect(() => {
    if (!jackpotWon) return;
    const end = jackpotWon.amount;
    const duration = 4000;
    const startTime = performance.now();
    const update = (now) => {
      const p = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayAmount(eased * end);
      if (p < 1) requestAnimationFrame(update);
      else setTimeout(onClose, 3500);
    };
    requestAnimationFrame(update);
  }, [jackpotWon, onClose]);

  if (!jackpotWon) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(circle, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.99) 100%)',
        cursor: 'pointer',
      }}
    >
      {/* Pulsing background glow */}
      <motion.div
        animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0.7, 0.3], backgroundColor: cfg.color }}
        transition={{ duration: 1.2, repeat: Infinity }}
        style={{ position: 'absolute', width: 700, height: 700, borderRadius: '50%', zIndex: -1, filter: 'blur(180px)' }}
      />

      <motion.div
        animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="jackpot-overlay-emoji"
      >
        {cfg.emoji}
      </motion.div>

      {/* Label */}
      <motion.h2
        initial={{ scale: 0, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        className="jackpot-overlay-label"
        style={{
          textShadow: `0 0 40px ${cfg.color}, 0 0 80px ${cfg.color}`,
        }}
      >
        {cfg.label}
      </motion.h2>

      {/* Amount */}
      <motion.div
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 0.3, repeat: Infinity }}
        className="jackpot-overlay-amount"
        style={{
          textShadow: `0 0 60px ${cfg.color}`,
        }}
      >
        <span style={{ fontSize: '0.4em', opacity: 0.7 }}>$</span>
        {displayAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </motion.div>

      <div className="jackpot-overlay-tap">
        Tap to continue
      </div>

      {/* Coin rain */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[...Array(120)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: -80, x: Math.random() * 100 + '%' }}
            animate={{ y: '110vh', rotate: Math.random() * 720 }}
            transition={{ duration: 1.5 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 3, ease: 'linear' }}
            style={{
              position: 'absolute',
              width: 18 + Math.random() * 18, height: 18 + Math.random() * 18,
              background: 'radial-gradient(ellipse at top left, #fff8b0 0%, #facc15 55%, #b48600 100%)',
              borderRadius: '50%',
              boxShadow: `0 0 12px rgba(250,204,21,0.8)`,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default JackpotWinOverlay;
