import React from 'react';
import { motion } from 'framer-motion';

const BonusTrigger = ({ onComplete }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onComplete}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(4, 0, 18, 0.92)',
        backdropFilter: 'blur(28px)',
        cursor: 'pointer',
      }}
    >
      {/* ── Intense Lightning Flashes ── */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[...Array(4)].map((_, i) => (
          <motion.svg
            key={`bolt-${i}`}
            viewBox="0 0 1000 1000"
            style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 5, filter: 'drop-shadow(0 0 15px #f5d060)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0, 0.8, 0] }}
            transition={{ duration: 0.3, repeat: Infinity, repeatDelay: Math.random() * 2, delay: i * 0.4 }}
          >
            <path
              d={`M ${Math.random() * 1000} 0 L ${Math.random() * 1000} 250 L ${Math.random() * 1000} 500 L ${Math.random() * 1000} 750 L ${Math.random() * 1000} 1000`}
              fill="none"
              stroke="#fff"
              strokeWidth="10"
              strokeLinecap="round"
            />
          </motion.svg>
        ))}
      </div>

      <motion.div
        animate={{ opacity: [0, 0.4, 0, 0.3, 0] }}
        transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 1 }}
        style={{
          position: 'absolute', inset: 0,
          background: 'white',
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
        }}
      />

      {/* Lightning particles */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, x: '50vw', y: '50vh', opacity: 1 }}
            animate={{
              scale: [0, 1, 0],
              x: `${Math.random() * 100}vw`,
              y: `${Math.random() * 100}vh`,
              opacity: [1, 0.8, 0],
            }}
            transition={{ duration: 0.8 + Math.random() * 0.6, repeat: Infinity, delay: Math.random() * 2 }}
            style={{
              position: 'absolute', width: 4, height: 4, borderRadius: '50%',
              background: Math.random() > 0.5 ? '#f5d060' : '#c87fff',
              boxShadow: '0 0 8px currentColor',
            }}
          />
        ))}
      </div>

      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        {/* "BONUS" text */}
        <motion.h2
          className="font-olympus"
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: [1, 1.08, 1], opacity: 1 }}
          transition={{ duration: 0.5, scale: { duration: 1.5, repeat: Infinity } }}
          style={{
            fontSize: 'clamp(3rem, 12vw, 6.5rem)',
            fontWeight: 900, margin: 0,
            background: 'linear-gradient(135deg, #fff8b0, #f5d060, #c8860a)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 40px rgba(245,208,60,0.9)) drop-shadow(0 0 80px rgba(168,85,247,0.5))',
          }}
        >
          BONUS!
        </motion.h2>

        {/* Subtitle */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{
            marginTop: 16,
            fontSize: 'clamp(1.6rem, 5vw, 2.8rem)',
            fontWeight: 900, letterSpacing: '0.05em', textTransform: 'uppercase',
            color: '#c87fff',
            filter: 'drop-shadow(0 0 20px rgba(168,85,247,0.8))',
            fontFamily: "'Cinzel Decorative', serif",
          }}
        >
          15 Free Spins
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="panel-label"
          style={{ marginTop: 12, color: 'rgba(200,140,255,0.45)' }}
        >
          Zeus blesses you with fortune!
        </motion.p>

        {/* Start button */}
        <motion.button
          id="bonus-trigger-start"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 2.2, type: 'spring' }}
          onClick={onComplete}
          className="btn-bonus"
          style={{
            marginTop: 40, padding: '16px 60px',
            fontSize: '1.1rem', fontWeight: 900,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            border: 'none', cursor: 'pointer',
          }}
        >
          Begin
        </motion.button>
      </div>
    </motion.div>
  );
};

export default BonusTrigger;
