import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameAudio from '../hooks/useGameAudio';

const STAGES = [
  { name: 'WINNING',    mult: 0,   color: '#3b82f6' }, // Sapphire blue anticipation stage
  { name: 'BIG WIN',    mult: 10,  color: '#f5d060' }, // Gold
  { name: 'SUPER WIN',  mult: 25,  color: '#f97316' }, // Orange
  { name: 'MEGA WIN',   mult: 50,  color: '#ef4444' }, // Red
  { name: 'ULTRA WIN',  mult: 100, color: '#a855f7' }, // Purple
  { name: 'MAX WIN',    mult: 200, color: '#facc15' }, // Yellow-gold
];

const BigWinOverlay = ({ amount, betAmount, onComplete }) => {
  const [displayAmount, setDisplayAmount] = useState(0);
  const [stageIdx, setStageIdx] = useState(0);
  const [shake, setShake] = useState(0);
  const [isCounting, setIsCounting] = useState(true);
  const multiplier = amount / betAmount;
  
  const lastStageRef = useRef(0);
  
  const { playBigWin, playMegaWin, playUltraWin, playWinTick, playEpicDrop } = useGameAudio();

  // Create stable refs for all callbacks to prevent any useEffect restarts from parent re-renders
  const playBigWinRef = useRef(playBigWin);
  const playMegaWinRef = useRef(playMegaWin);
  const playUltraWinRef = useRef(playUltraWin);
  const playWinTickRef = useRef(playWinTick);
  const playEpicDropRef = useRef(playEpicDrop);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    playBigWinRef.current = playBigWin;
    playMegaWinRef.current = playMegaWin;
    playUltraWinRef.current = playUltraWin;
    playWinTickRef.current = playWinTick;
    playEpicDropRef.current = playEpicDrop;
    onCompleteRef.current = onComplete;
  }, [playBigWin, playMegaWin, playUltraWin, playWinTick, playEpicDrop, onComplete]);

  // Play epic drop impact sound on mount
  useEffect(() => {
    playEpicDropRef.current();
  }, []);

  // Periodic ticking sound during active counting
  useEffect(() => {
    if (!isCounting) return;
    const tickInterval = setInterval(() => {
      playWinTickRef.current();
    }, 150);
    return () => clearInterval(tickInterval);
  }, [isCounting]);

  useEffect(() => {
    let start = 0;
    const end = amount;
    const duration = 6000; // Smooth 6 second epic count up duration
    const startTime = performance.now();

    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic count up
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
        setShake(10 + nextStage * 10);
        setTimeout(() => setShake(0), 500);

        // Play progressive fanfares dynamically as thresholds are crossed
        if (nextStage === 1) {
          playBigWinRef.current(); // BIG WIN reached!
        } else if (nextStage === 2 || nextStage === 3) {
          playMegaWinRef.current(); // SUPER / MEGA WIN reached!
        } else if (nextStage >= 4) {
          playUltraWinRef.current(); // ULTRA / MAX WIN reached!
        }
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        setIsCounting(false);
        setTimeout(() => {
          if (onCompleteRef.current) onCompleteRef.current();
        }, 3000);
      }
    };

    requestAnimationFrame(update);
  }, [amount, betAmount]);

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
          className="win-overlay-title"
          style={{
            textShadow: `0 0 40px ${currentStage.color}, 0 0 80px ${currentStage.color}`,
          }}
        >
          {currentStage.name}
        </motion.h2>
      </AnimatePresence>

      {/* ── Win Amount ── */}
      <motion.div
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="win-overlay-amount"
          style={{
            textShadow: `0 0 60px ${currentStage.color}`,
          }}
      >
        <span style={{ fontSize: '0.4em', opacity: 0.8 }}>$</span>
        {displayAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </motion.div>

      {/* ── Win Label ── */}
      <div 
        className="win-overlay-label"
        style={{ 
          border: `2px solid ${currentStage.color}`,
        }}
      >
        TOTAL WIN
      </div>

      {/* ── Coins / Particles ── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {[...Array(65)].map((_, i) => {
          const isCoin = i % 2 === 0;
          const size = 16 + Math.random() * 24;
          return (
            <motion.div
              key={i}
              initial={{ y: -100, x: Math.random() * 100 + "%", rotate: 0 }}
              animate={{ 
                y: '105vh',
                rotate: Math.random() * 720 + 360,
                x: `calc(${Math.random() * 100}% + ${(Math.random() - 0.5) * 120}px)`
              }}
              transition={{ 
                duration: 2.0 + Math.random() * 2.0,
                repeat: Infinity,
                delay: Math.random() * 2.5,
                ease: 'linear'
              }}
              style={{
                position: 'absolute',
                width: size, height: size,
                background: isCoin 
                  ? 'radial-gradient(ellipse at top left, #fff8b0 0%, #facc15 50%, #b48600 100%)' 
                  : currentStage.color,
                borderRadius: isCoin ? '50%' : '4px',
                border: isCoin ? '1.5px solid rgba(255,255,255,0.4)' : 'none',
                boxShadow: `0 3px 8px rgba(0,0,0,0.35), 0 0 8px ${isCoin ? '#facc15' : currentStage.color}`,
                willChange: 'transform',
                zIndex: Math.random() > 0.5 ? 90 : -5
              }}
            />
          );
        })}
      </div>
    </motion.div>
  );
};

export default BigWinOverlay;
