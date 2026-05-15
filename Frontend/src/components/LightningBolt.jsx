import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LightningBolt = ({ active }) => {
  // Generate random points for a jagged lightning bolt
  const boltPath = useMemo(() => {
    let path = "M 500 0";
    let x = 500;
    let y = 0;
    for (let i = 1; i <= 10; i++) {
      x += (Math.random() - 0.5) * 150;
      y += 100;
      path += ` L ${x} ${y}`;
    }
    return path;
  }, [active]); // Re-generate when active changes to create a new shape

  return (
    <AnimatePresence>
      {active && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center overflow-hidden">
          {/* ── Screen Flash (Intense White) ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.4, 0.8, 0] }}
            transition={{ duration: 0.4, times: [0, 0.1, 0.3, 0.5, 1] }}
            style={{ position: 'fixed', inset: 0, background: '#fff', zIndex: 1 }}
          />

          {/* ── Color Tint Flash ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 0.8 }}
            style={{ 
              position: 'fixed', inset: 0, 
              background: 'radial-gradient(circle, rgba(0,212,255,0.4) 0%, rgba(168,85,247,0.3) 100%)',
              zIndex: 2 
            }}
          />

          {/* ── The Lightning Bolt SVG ── */}
          <svg 
            viewBox="0 0 1000 1000" 
            style={{ 
              position: 'absolute', width: '100%', height: '100%', 
              zIndex: 3, filter: 'drop-shadow(0 0 20px #00d4ff) drop-shadow(0 0 40px #a855f7)' 
            }}
          >
            {/* Inner Core */}
            <motion.path
              d={boltPath}
              fill="none"
              stroke="#fff"
              strokeWidth="12"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: [0, 1, 0.8, 1, 0] }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
            
            {/* Outer Glow Path */}
            <motion.path
              d={boltPath}
              fill="none"
              stroke="#00d4ff"
              strokeWidth="25"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: [0, 0.7, 0] }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{ filter: 'blur(8px)' }}
            />

            {/* Random branches */}
            {[...Array(3)].map((_, i) => (
              <motion.path
                key={i}
                d={`M ${400 + Math.random() * 200} ${100 + i * 200} L ${Math.random() * 1000} ${Math.random() * 1000}`}
                fill="none"
                stroke="#a855f7"
                strokeWidth="4"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.3, delay: 0.1 * i }}
              />
            ))}
          </svg>

          {/* ── Secondary Flash ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 0.2, delay: 0.1 }}
            style={{ position: 'fixed', inset: 0, background: '#00d4ff', mixBlendMode: 'overlay', zIndex: 4 }}
          />
        </div>
      )}
    </AnimatePresence>
  );
};

export default LightningBolt;
