import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Symbol from './Symbol';

const SlotGrid = ({ grid, winningCoords = [], isBonusMode = false, onSymbolLand }) => {
  const isWinning = (r, c) => Array.isArray(winningCoords) && winningCoords.some(([wr, wc]) => wr === r && wc === c);
  const safeId = (id) => (id && typeof id === 'string' ? id : 'blue_stone');

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
                      type: 'spring',
                      stiffness: 500,
                      damping: 25,
                      mass: 0.8,
                      delay: cIndex * 0.03 + (rIndex * 0.02),
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
