"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function Loading({ isReady = false, onComplete = () => {} }) {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    let progressInterval;

    if (!isReady) {
      // Simulate slow loading up to 92%
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 60) return prev + 3; // Fast initially
          if (prev < 80) return prev + 1.5; // Slower
          if (prev < 92) return prev + 0.5; // Very slow
          return prev; // Stop at 92%
        });
      }, 150);
    } else {
      // Data is ready: Jump to 100% immediately
      setProgress(100);
      
      // Wait for the width animation to visually reach 100%, then fade out
      const fadeTimer = setTimeout(() => {
        setIsFadingOut(true);
      }, 600); // Wait 0.6s to let user see 100%

      // Tell parent we are done fading out so it can mount the game
      const completeTimer = setTimeout(() => {
        onComplete();
      }, 1200); // 0.6s wait + 0.6s fade duration

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(completeTimer);
      };
    }

    return () => clearInterval(progressInterval);
  }, [isReady, onComplete]);

  return (
    <div className={`flex flex-col justify-center items-center h-screen w-full bg-[#050505] font-sans select-none overflow-hidden text-white absolute inset-0 z-[9999] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1a0f00] via-[#050505] to-black transition-opacity duration-700 ease-out ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
      
      {/* Floating Logo Container */}
      <div className="relative mb-12 animate-float">
        {/* Glow effect behind logo */}
        <div className="absolute inset-0 bg-orange-500/20 blur-[50px] rounded-full scale-150 animate-pulse-slow"></div>
        
        {/* The actual Logo */}
        <div className="relative w-48 h-48 md:w-64 md:h-64 drop-shadow-[0_0_15px_rgba(255,153,0,0.4)]">
          <Image 
            src="/zeus.png" 
            alt="Zeus Legacy Logo" 
            fill
            className="object-contain"
            priority
          />
        </div>
        
        {/* Text under Logo */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap tracking-[0.3em] text-orange-200/60 font-semibold text-sm md:text-base uppercase transition-opacity duration-300" style={{ opacity: isReady ? 1 : 0.8 }}>
          {isReady ? 'READY!' : 'Legacy Awakes'}
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="w-80 md:w-[28rem] h-1.5 md:h-2 bg-[#1a1a1a] rounded-full overflow-hidden relative shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        {/* Animated Progress Fill with JS width */}
        <div 
          className="h-full bg-gradient-to-r from-orange-600 via-orange-400 to-[#f5d060] shadow-[0_0_12px_rgba(255,153,0,0.8)] transition-all duration-300 ease-out" 
          style={{ width: progress + '%' }}
        />
      </div>

      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
        @keyframes pulseSlow {
          0%, 100% { opacity: 0.5; transform: scale(1.2); }
          50% { opacity: 1; transform: scale(1.6); }
        }
        
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulseSlow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
