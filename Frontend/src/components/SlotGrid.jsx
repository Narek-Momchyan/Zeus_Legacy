import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Symbol from './Symbol';

const SlotGrid = ({ grid, winningCoords = [], isBonusMode = false, onSymbolLand, speedMode = 'normal' }) => {
  const isWinning = (r, c) => Array.isArray(winningCoords) && winningCoords.some(([wr, wc]) => wr === r && wc === c);
  const safeId = (id) => (id && typeof id === 'string' ? id : 'blue_stone');

  const isInstant = speedMode === 'instant';
  const isTurbo = speedMode === 'turbo';

  const springStiffness = isInstant ? 1000 : (isTurbo ? 450 : 120);
  const springDamping = isInstant ? 40 : (isTurbo ? 24 : 15);

  return (
    <div
      className={`slot-grid-wrap relative z-10 transition-all duration-500 ${isBonusMode ? 'bonus-grid' : 'glow-gold'}`}
    >
      {Array.isArray(grid) && grid.map((row, rIndex) =>
        Array.isArray(row) && row.map((cell, cIndex) => {
          const symbolId = cell?.sym || cell;
          const uid = cell?.uid || `${rIndex}-${cIndex}`;
          const id = safeId(symbolId);
          const winning = isWinning(rIndex, cIndex);
          const isMult = typeof id === 'string' && id.startsWith('mult_');

          const delayVal = isInstant ? 0 : (isTurbo ? (cIndex * 0.02) : (cIndex * 0.06 + rIndex * 0.04));

          return (
            <div
              key={uid}
              className={`sym-cell ${isMult ? 'mult-ring' : ''} ${winning ? 'symbol-win' : ''}`}
              style={{
                minWidth: 0, minHeight: 0,
                position: 'relative',
              }}
            >
              <AnimatePresence mode="popLayout">
                {winning ? (
                  /* ── INTENSE WIN PULSE ── */
                  <motion.div
                    key="win-pulse"
                    initial={{ scale: 1, filter: 'brightness(1)' }}
                    animate={{
                      scale: [1, 1.15, 1],
                      filter: ['brightness(1)', 'brightness(1.8)', 'brightness(1)']
                    }}
                    transition={{ duration: 0.4, repeat: Infinity }}
                    style={{ width: '100%', height: '100%', zIndex: 10 }}
                  >
                    <Symbol id={id} />
                  </motion.div>
                ) : (
                  /* ── SYMBOL LANDING ── */
                  <motion.div
                    key={`s-${uid}`}
                    initial={{ y: -60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{
                      type: isInstant ? 'tween' : 'spring',
                      stiffness: springStiffness,
                      damping: springDamping,
                      mass: 0.85,
                      delay: delayVal,
                      duration: isInstant ? 0.05 : undefined
                    }}
                    onAnimationComplete={() => {
                      if (onSymbolLand) onSymbolLand();
                    }}
                    style={{ width: '100%', height: '100%' }}
                  >
                    <Symbol id={id} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })
      )}
    </div>
  );
};

export default SlotGrid;
