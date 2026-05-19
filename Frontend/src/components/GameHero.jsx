import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

const DEFAULT_SRC = '/zeus.png';

const GameHero = ({ isAttacking, isBonusMode }) => {
  const [src, setSrc] = React.useState(DEFAULT_SRC);
  const isRemote = src.startsWith('http');

  React.useEffect(() => {
    const apply = () => {
      if (typeof window !== 'undefined' && window.customHeroImage) {
        setSrc(window.customHeroImage);
      }
    };
    apply();
    window.addEventListener('gameConfigLoaded', apply);
    return () => window.removeEventListener('gameConfigLoaded', apply);
  }, []);

  return (
    <aside className="hero-panel" aria-hidden="true">
      <motion.div
        className="hero-frame"
        animate={
          isAttacking
            ? { scale: [1, 1.06, 1], filter: ['brightness(1)', 'brightness(1.25)', 'brightness(1)'] }
            : { y: [0, -6, 0] }
        }
        transition={isAttacking ? { duration: 0.35 } : { duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Image
          src={src}
          alt=""
          width={256}
          height={256}
          priority
          unoptimized={isRemote}
          className={`hero-image${isBonusMode ? ' hero-image--bonus' : ''}`}
        />
      </motion.div>
    </aside>
  );
};

export default React.memo(GameHero);
