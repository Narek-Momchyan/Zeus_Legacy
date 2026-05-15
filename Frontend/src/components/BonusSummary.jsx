import React from 'react';
import { motion } from 'framer-motion';
import AnimatedNumber from './AnimatedNumber';

const BonusSummary = ({ totalWin, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 250,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(4, 0, 18, 0.94)',
        backdropFilter: 'blur(28px)',
        cursor: 'pointer',
      }}
    >
      {/* Rain of gold particles */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {[...Array(60)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: -20, x: Math.random() * 100 + 'vw', opacity: 1, rotate: 0 }}
            animate={{ y: '108vh', rotate: 360 + Math.random() * 360, opacity: [1, 1, 0] }}
            transition={{
              duration: 2.5 + Math.random() * 2.5,
              repeat: Infinity,
              delay: Math.random() * 4,
              ease: 'linear',
            }}
            style={{
              position: 'absolute', width: 5, height: 5,
              borderRadius: Math.random() > 0.5 ? '50%' : 1,
              background: Math.random() > 0.5 ? '#f5d060' : '#c87fff',
              boxShadow: '0 0 4px currentColor',
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ scale: 0.75, y: 60 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 22 }}
        className="glass"
        style={{
          padding: '48px 32px',
          textAlign: 'center',
          maxWidth: 520, width: '92%',
          border: '1px solid rgba(168,85,247,0.35)',
          boxShadow: '0 0 80px rgba(140,60,240,0.35), 0 0 160px rgba(100,20,200,0.2)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none',
          background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(140,60,240,0.18) 0%, transparent 70%)',
        }} />

        <motion.h2
          className="font-olympus"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            fontSize: 'clamp(1.4rem, 4.2vw, 2.2rem)',
            fontWeight: 900, margin: '0 0 12px',
            color: '#c87fff',
            filter: 'drop-shadow(0 0 20px rgba(168,85,247,0.8))',
            overflowWrap: 'break-word',
            lineHeight: 1.2,
          }}
        >
          Congratulations!
        </motion.h2>

        <p className="panel-label" style={{ color: 'rgba(200,140,255,0.5)', marginBottom: 32 }}>
          BONUS ROUND COMPLETE
        </p>

        <div className="panel-label" style={{ marginBottom: 8 }}>Total Win</div>

        <div style={{
          fontSize: 'clamp(3.5rem, 11vw, 6rem)',
          fontWeight: 900, fontFamily: "'Outfit', monospace",
          lineHeight: 1.05, marginBottom: 40,
          background: 'linear-gradient(135deg, #fff8b0, #f5d060, #c8860a)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 0 28px rgba(245,208,60,0.5))',
        }}>
          $<AnimatedNumber value={totalWin} />
        </div>

        <button
          id="bonus-summary-collect"
          onClick={onClose}
          className="btn-bonus"
          style={{
            padding: '16px 64px', fontSize: '1.05rem',
            fontWeight: 900, letterSpacing: '0.12em',
            textTransform: 'uppercase', border: 'none', cursor: 'pointer',
          }}
        >
          Collect
        </button>
      </motion.div>
    </motion.div>
  );
};

export default BonusSummary;
