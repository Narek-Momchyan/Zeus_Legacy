import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const GlobalMultiplier = ({ value, isBonusMode }) => {
  if (!isBonusMode && value <= 1) return null;

  return (
    <motion.div
      className="global-multiplier-wrap"
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -80, opacity: 0 }}
      style={{ position: 'fixed', top: 20, left: 20, zIndex: 50 }}
    >
      <div style={{ position: 'relative' }}>
        {/* Outer ambient glow */}
        <div style={{
          position: 'absolute', inset: -12,
          background: isBonusMode
            ? 'radial-gradient(circle, rgba(168,85,247,0.3) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(245,208,60,0.2) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }} />

        <div
          className="glass"
          style={{
            position: 'relative', padding: '16px 22px',
            border: isBonusMode ? '1px solid rgba(168,85,247,0.35)' : '1px solid rgba(245,208,60,0.2)',
            boxShadow: isBonusMode
              ? '0 0 30px rgba(168,85,247,0.3)'
              : '0 0 20px rgba(245,208,60,0.18)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          }}
        >
          <span className="panel-label" style={{ fontSize: 9 }}>Multiplier</span>

          <AnimatePresence mode="wait">
            <motion.div
              key={value}
              initial={{ scale: 1.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={{
                fontFamily: "'Outfit', monospace",
                fontSize: '2.4rem',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                fontStyle: 'italic',
                lineHeight: 1,
                ...(isBonusMode
                  ? { color: '#c87fff', filter: 'drop-shadow(0 0 14px rgba(168,85,247,0.9))' }
                  : {
                      background: 'linear-gradient(135deg, #fff8b0, #f5d060, #c8860a)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                      filter: 'drop-shadow(0 0 10px rgba(245,208,60,0.6))',
                    }
                ),
              }}
            >
              ×{value}
            </motion.div>
          </AnimatePresence>

          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            style={{ fontSize: 14 }}
          >
            ⚡
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
};

export default GlobalMultiplier;
