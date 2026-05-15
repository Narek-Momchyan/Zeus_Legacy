import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ZeusCharacter = ({ isAttacking, isBonusMode }) => {
  const zeusImg = "/zeus.png";

  return (
    <div className="zeus-container" style={{
      position: 'relative',
      width: '300px',
      height: '450px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* ── Electric Aura ── */}
      <motion.div
        animate={{ 
          rotate: 360,
          scale: isAttacking ? [1, 1.5, 1.2] : 1,
          opacity: isAttacking ? [0.4, 0.8, 0.4] : 0.2
        }}
        transition={{ 
          rotate: { duration: 10, repeat: Infinity, ease: "linear" },
          scale: { duration: 0.5 }
        }}
        style={{
          position: 'absolute', width: '400px', height: '400px',
          border: '2px dashed rgba(96,165,250,0.3)',
          borderRadius: '50%', zIndex: 0,
          boxShadow: '0 0 50px rgba(96,165,250,0.2)'
        }}
      />

      {/* ── Zeus Main Image ── */}
      <motion.div
        animate={isAttacking ? {
          scale: [1, 1.15, 1],
          z: [0, 50, 0],
          rotateX: [0, -10, 0],
          filter: ['brightness(1) blur(0px)', 'brightness(1.8) blur(0px)', 'brightness(1) blur(0px)'],
        } : {
          y: [0, -15, 0],
        }}
        transition={isAttacking ? { duration: 0.4 } : { duration: 5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          zIndex: 5,
          perspective: '1000px'
        }}
      >
        <img 
          src={zeusImg} 
          alt="Zeus" 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'contain',
            filter: isBonusMode ? 'drop-shadow(0 0 40px rgba(168,85,247,0.9))' : 'drop-shadow(0 0 30px rgba(245,208,60,0.7))',
          }} 
        />

        {/* ── Glowing Eyes ── */}
        <AnimatePresence>
          {isAttacking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0 }}
            >
              <div style={{
                position: 'absolute', top: '22%', left: '41%',
                width: 18, height: 18, borderRadius: '50%',
                background: '#fff', filter: 'blur(4px)',
                boxShadow: '0 0 30px #60a5fa, 0 0 60px #fff',
              }} />
              <div style={{
                position: 'absolute', top: '22%', right: '41%',
                width: 18, height: 18, borderRadius: '50%',
                background: '#fff', filter: 'blur(4px)',
                boxShadow: '0 0 30px #60a5fa, 0 0 60px #fff',
              }} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── High-Fidelity Lightning Strands ── */}
      <AnimatePresence>
        {isAttacking && (
          <div style={{ position: 'absolute', top: '30%', right: '50%', zIndex: 10 }}>
            {/* Core Strand */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ 
                opacity: [0, 1, 0.5, 1, 0],
                scaleX: [0, 1.1, 1],
                x: [0, -450],
              }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              style={{
                position: 'absolute', width: '500px', height: '60px',
                background: 'linear-gradient(90deg, transparent, #fff, #60a5fa, transparent)',
                clipPath: 'polygon(0% 50%, 15% 20%, 35% 80%, 55% 30%, 75% 70%, 90% 40%, 100% 50%, 85% 60%, 65% 10%, 45% 90%, 25% 30%, 5% 70%)',
                filter: 'blur(1px) drop-shadow(0 0 30px #60a5fa)',
              }}
            />
            
            {/* Secondary Branching Strand */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ 
                opacity: [0, 0.8, 0.4, 0.8, 0],
                scaleX: [0, 0.9, 0.8],
                x: [0, -350],
                rotate: [-5, 5, -5]
              }}
              transition={{ duration: 0.4, delay: 0.05 }}
              style={{
                position: 'absolute', width: '400px', height: '40px',
                background: 'linear-gradient(90deg, transparent, #fff, #93c5fd, transparent)',
                clipPath: 'polygon(0% 50%, 20% 10%, 40% 90%, 60% 20%, 80% 80%, 100% 50%)',
                filter: 'blur(2px) drop-shadow(0 0 15px #60a5fa)',
                top: 20
              }}
            />

            {/* Impact Sparkle */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 2, 0],
                opacity: [0, 1, 0],
                x: -450
              }}
              transition={{ duration: 0.5, delay: 0.1 }}
              style={{
                position: 'absolute', width: 100, height: 100,
                background: 'radial-gradient(circle, #fff 0%, #60a5fa 50%, transparent 100%)',
                borderRadius: '50%', filter: 'blur(10px)',
                left: 0, top: -20
              }}
            />
          </div>
        )}
      </AnimatePresence>

      {/* ── Aura / Platform ── */}
      <div style={{
        position: 'absolute', bottom: 0, width: '250px', height: '60px',
        background: isBonusMode ? 'radial-gradient(circle, rgba(168,85,247,0.3) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(245,208,60,0.2) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(15px)', zIndex: 1
      }} />
    </div>
  );
};

export default ZeusCharacter;
