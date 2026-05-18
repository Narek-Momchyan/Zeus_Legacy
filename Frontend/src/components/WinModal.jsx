import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const WinModal = ({ amount, onClose, betAmount }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = amount;
    if (start === end) return;
    const duration = 1200; // Speed up count-up for snappier feedback
    const increment = end / (duration / 16);
    let timer = setInterval(() => {
      start += increment;
      if (start >= end) { setDisplayValue(end); clearInterval(timer); }
      else setDisplayValue(start);
    }, 16);
    return () => clearInterval(timer);
  }, [amount]);

  // Win Tiers based on multiplier
  const multiplier = amount / (betAmount || 1);
  let tier = 'win';
  let tierLabel = '✦ WIN ✦';
  let tierColor = '#d4a012';
  let glowColor = 'rgba(212,160,18,0.5)';

  if (multiplier >= 100) {
    tier = 'sensational';
    tierLabel = '💎 SENSATIONAL WIN 💎';
    tierColor = '#c87fff'; // Purple
    glowColor = 'rgba(200,127,255,0.7)';
  } else if (multiplier >= 50) {
    tier = 'super';
    tierLabel = '🔥 SUPER WIN 🔥';
    tierColor = '#ff4d4d'; // Red
    glowColor = 'rgba(255,77,77,0.6)';
  } else if (multiplier >= 20) {
    tier = 'mega';
    tierLabel = '⚡ MEGA WIN ⚡';
    tierColor = '#ffaa00'; // Orange
    glowColor = 'rgba(255,170,0,0.6)';
  } else if (multiplier >= 10) {
    tier = 'big';
    tierLabel = '🏆 BIG WIN 🏆';
    tierColor = '#f5d060'; // Gold
    glowColor = 'rgba(245,208,96,0.6)';
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose} // Allow clicking anywhere on the backdrop to collect instantly!
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        background: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(30px)',
        cursor: 'pointer',
      }}
    >
      {/* Background Shockwave */}
      <motion.div
        initial={{ scale: 0, opacity: 0.5 }}
        animate={{ scale: 4, opacity: 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        style={{
          position: 'absolute', width: 400, height: 400,
          borderRadius: '50%', border: `4px solid ${tierColor}`,
          pointerEvents: 'none',
        }}
      />

      <motion.div
        initial={{ scale: 0.2, rotate: -10, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal content
        className="glass"
        style={{
          padding: '64px 48px',
          textAlign: 'center',
          maxWidth: 520, width: '100%',
          border: `2px solid ${tierColor}`,
          boxShadow: `0 0 80px ${glowColor}, inset 0 0 40px ${glowColor}`,
          position: 'relative', overflow: 'hidden',
          borderRadius: '24px',
        }}
      >
        {/* Animated Background Rays */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          style={{
            position: 'absolute', top: '50%', left: '50%',
            width: 800, height: 800, marginLeft: -400, marginTop: -400,
            background: `conic-gradient(from 0deg, transparent, ${tierColor}22, transparent, ${tierColor}22, transparent)`,
            opacity: 0.4, pointerEvents: 'none', zIndex: 0
          }}
        />

        {/* Tier label with Hype */}
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            filter: [`drop-shadow(0 0 10px ${tierColor})`, `drop-shadow(0 0 30px ${tierColor})`, `drop-shadow(0 0 10px ${tierColor})`]
          }}
          transition={{ duration: 0.6, repeat: Infinity }}
          style={{ position: 'relative', zIndex: 10 }}
        >
          <h2 className="font-olympus" style={{
            fontSize: 'clamp(1.6rem, 5vw, 2.4rem)',
            fontWeight: 900, margin: '0 0 12px',
            color: '#fff',
            WebkitTextStroke: `1px ${tierColor}`,
          }}>
            {tierLabel}
          </h2>
          <div style={{
            fontSize: '0.9rem', color: tierColor, fontWeight: 700,
            letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 24
          }}>
            {multiplier.toFixed(0)}x Multiplier
          </div>
        </motion.div>

        {/* Amount */}
        <motion.div 
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 0.1, repeat: Infinity }}
          style={{
            position: 'relative', zIndex: 10,
            fontSize: 'clamp(3.5rem, 12vw, 6.5rem)',
            fontWeight: 900, fontFamily: "'Outfit', sans-serif",
            lineHeight: 1, marginBottom: 40,
            background: 'linear-gradient(180deg, #fff 0%, #f5d060 50%, #c8860a 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))',
          }}
        >
          ${displayValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </motion.div>

        {/* Collect button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          id="win-modal-collect"
          onClick={onClose}
          className="btn-spin"
          style={{
            position: 'relative', zIndex: 10,
            padding: '16px 72px', fontSize: '1.2rem',
            fontWeight: 900, letterSpacing: '0.15em',
            textTransform: 'uppercase', border: 'none', cursor: 'pointer',
            background: `linear-gradient(180deg, ${tierColor}, #000)`,
            boxShadow: `0 8px 20px ${tierColor}44`,
          }}
        >
          Collect
        </motion.button>

        {/* Particles / Sparkles */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ x: '50%', y: '100%', opacity: 0 }}
              animate={{
                x: `${Math.random() * 100}%`,
                y: `${-20 + Math.random() * 100}%`,
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                rotate: Math.random() * 720,
              }}
              transition={{ 
                duration: 2 + Math.random() * 2, 
                repeat: Infinity, 
                delay: Math.random() * 2 
              }}
              style={{
                position: 'absolute', width: 8, height: 8,
                background: i % 2 === 0 ? '#fff' : tierColor,
                borderRadius: i % 3 === 0 ? '50%' : '0%',
                boxShadow: `0 0 10px ${tierColor}`,
              }}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default WinModal;
