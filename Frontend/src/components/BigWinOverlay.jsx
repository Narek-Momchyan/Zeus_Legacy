import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STAGES = [
  { name: 'BIG WIN',   mult: 10,  color: '#f5d060' },
  { name: 'SUPER WIN', mult: 25,  color: '#f97316' },
  { name: 'MEGA WIN',  mult: 50,  color: '#ef4444' },
  { name: 'ULTRA WIN', mult: 100, color: '#a855f7' },
  { name: 'MAX WIN',   mult: 1000, color: '#facc15' },
];

const BigWinOverlay = ({ amount, betAmount, onComplete }) => {
  const [displayAmount, setDisplayAmount] = useState(0);
  const [stageIdx, setStageIdx] = useState(0);
  const [shake, setShake] = useState(0);
  const multiplier = amount / betAmount;
  
  const lastStageRef = useRef(0);

  useEffect(() => {
    let start = 0;
    const end = amount;
    const duration = 6000; // Longer, more epic duration
    const startTime = performance.now();

    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic for the count up
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = easedProgress * end;
      const currentMult = current / betAmount;
      
      setDisplayAmount(current);

      // Find current stage
      let nextStage = 0;
      for (let i = STAGES.length - 1; i >= 0; i--) {
        if (currentMult >= STAGES[i].mult) {
          nextStage = i;
          break;
        }
      }

      if (nextStage !== lastStageRef.current) {
        setStageIdx(nextStage);
        lastStageRef.current = nextStage;
        setShake(10 + nextStage * 10); // Increase shake on stage up
        setTimeout(() => setShake(0), 500);
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        setTimeout(onComplete, 3000);
      }
    };

    requestAnimationFrame(update);
  }, [amount, betAmount, onComplete]);

  const currentStage = STAGES[stageIdx];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: 1,
        x: shake ? [0, -shake, shake, -shake, 0] : 0 
      }}
      exit={{ opacity: 0 }}
      onClick={onComplete}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(circle, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.98) 100%)',
        backdropFilter: 'blur(15px)',
        cursor: 'pointer',
      }}
    >
      {/* ── Background Glow ── */}
      <motion.div
        animate={{ 
          scale: [1, 1.4, 1],
          opacity: [0.2, 0.5, 0.2],
          backgroundColor: currentStage.color
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
        style={{
          position: 'absolute', width: 800, height: 800,
          borderRadius: '50%', zIndex: -1, filter: 'blur(150px)'
        }}
      />

      {/* ── Title Stage ── */}
      <AnimatePresence mode="wait">
        <motion.h2
          key={currentStage.name}
          initial={{ scale: 0.2, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 1.5, opacity: 0 }}
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(4rem, 12vw, 8rem)',
            fontWeight: 900,
            margin: 0,
            color: '#fff',
            textShadow: `0 0 40px ${currentStage.color}, 0 0 80px ${currentStage.color}`,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            textAlign: 'center'
          }}
        >
          {currentStage.name}
        </motion.h2>
      </AnimatePresence>

      {/* ── Win Amount ── */}
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 0.2, repeat: Infinity }}
        style={{
          fontSize: 'clamp(5rem, 18vw, 12rem)',
          fontWeight: 900,
          color: '#fff',
          fontFamily: "'Inter', sans-serif",
          textShadow: `0 0 60px ${currentStage.color}`,
          marginTop: -20,
          display: 'flex',
          alignItems: 'baseline',
          gap: 10
        }}
      >
        <span style={{ fontSize: '0.4em', opacity: 0.8 }}>$</span>
        {displayAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </motion.div>

      {/* ── Win Label ── */}
      <div style={{ 
        marginTop: 20, padding: '10px 30px', borderRadius: 40, 
        background: 'rgba(255,255,255,0.1)', border: `2px solid ${currentStage.color}`,
        fontSize: '1.2rem', fontWeight: 900, color: '#fff',
        letterSpacing: '0.1em', textTransform: 'uppercase'
      }}>
        TOTAL WIN
      </div>

      {/* ── Coins / Particles ── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: -100, x: Math.random() * 100 + "%", rotate: 0 }}
            animate={{ 
              y: '110vh',
              rotate: 720,
              x: (Math.random() - 0.5) * 50 + "%"
            }}
            transition={{ 
              duration: 1.5 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
            style={{
              position: 'absolute',
              width: 25, height: 25,
              background: i % 2 === 0 ? 'gold' : currentStage.color,
              borderRadius: i % 3 === 0 ? '50%' : '4px',
              boxShadow: `0 0 15px ${currentStage.color}`
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default BigWinOverlay;
