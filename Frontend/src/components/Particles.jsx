import React from 'react';
import { motion } from 'framer-motion';

const Particles = ({ active }) => {
  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[80] overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            x: '50vw', 
            y: '100vh', 
            opacity: 1, 
            scale: Math.random() * 0.5 + 0.5,
            rotate: 0 
          }}
          animate={{ 
            x: `${Math.random() * 100}vw`, 
            y: '-10vh',
            rotate: 360 * 2,
            opacity: 0 
          }}
          transition={{ 
            duration: 1.5 + Math.random(), 
            ease: "easeOut",
            delay: Math.random() * 0.5 
          }}
          className="absolute"
        >
          {/* Gold Coin SVG */}
          <svg width="40" height="40" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="#ffd700" stroke="#b8860b" strokeWidth="5" />
            <circle cx="50" cy="50" r="30" fill="none" stroke="#b8860b" strokeWidth="2" />
            <text x="50" y="65" textAnchor="middle" fill="#b8860b" fontSize="40" fontWeight="bold">$</text>
          </svg>
        </motion.div>
      ))}
    </div>
  );
};

export default Particles;
