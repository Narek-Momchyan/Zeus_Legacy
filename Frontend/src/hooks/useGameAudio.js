import { useState, useEffect, useCallback, useRef } from 'react';

const SOUNDS = {
  stoneTumble: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', 
  sparkleWin: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  lightningHit: 'https://assets.mixkit.co/active_storage/sfx/1287/1287-preview.mp3',
  epicDrop: 'https://assets.mixkit.co/active_storage/sfx/632/632-preview.mp3',
  freeSpinsTheme: 'https://assets.mixkit.co/active_storage/sfx/2290/2290-preview.mp3',
  bigWin: 'https://assets.mixkit.co/active_storage/sfx/1993/1993-preview.mp3',
  megaWin: 'https://assets.mixkit.co/active_storage/sfx/2004/2004-preview.mp3',
  ultraWin: 'https://assets.mixkit.co/active_storage/sfx/2012/2012-preview.mp3',
  anteToggle: 'https://assets.mixkit.co/active_storage/sfx/2562/2562-preview.mp3',
  symbolExplode: 'https://assets.mixkit.co/active_storage/sfx/1105/1105-preview.mp3',
  collectMultiplier: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
  winTick: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  scatterImpact: 'https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3',
};

const useGameAudio = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioCache = useRef({});

  const audioReadyRef = useRef(false);

  const loadAudios = useCallback((force = false) => {
    if (audioReadyRef.current && !force) return;
    audioReadyRef.current = true;

    Object.entries(SOUNDS).forEach(([key, defaultUrl]) => {
      const customUrl = typeof window !== 'undefined' && window.customGameAudios && window.customGameAudios[key];
      const finalUrl = customUrl || defaultUrl;

      const currentAudio = audioCache.current[key];
      if (!currentAudio || currentAudio.src !== finalUrl) {
        const audio = new Audio(finalUrl);
        audio.preload = 'auto';
        audio.load();
        audioCache.current[key] = audio;
      }
    });
    setIsLoaded(true);
  }, []);

  // Defer remote audio until first interaction (faster initial load)
  useEffect(() => {
    const saved = localStorage.getItem('slot_muted') === 'true';
    setIsMuted(saved);

    const primeAudio = () => {
      loadAudios();
      window.removeEventListener('pointerdown', primeAudio);
      window.removeEventListener('keydown', primeAudio);
    };

    const onConfigLoaded = () => loadAudios(true);

    window.addEventListener('pointerdown', primeAudio, { once: true });
    window.addEventListener('keydown', primeAudio, { once: true });
    window.addEventListener('gameConfigLoaded', onConfigLoaded);

    return () => {
      window.removeEventListener('pointerdown', primeAudio);
      window.removeEventListener('keydown', primeAudio);
      window.removeEventListener('gameConfigLoaded', onConfigLoaded);
    };
  }, [loadAudios]);

  const bonusThemeRef = useRef(null);

  const toggleMute = () => {
    setIsMuted(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('slot_muted', String(next));
      }
      return next;
    });
  };

  const playSound = useCallback((soundKey, options = {}) => {
    if (isMuted) return null;
    
    const { loop = false, volume = 1, forceNew = false } = options;
    const cachedAudio = audioCache.current[soundKey];

    if (!cachedAudio) return null;

    let audioToPlay;

    if (forceNew) {
      audioToPlay = cachedAudio.cloneNode();
    } else {
      audioToPlay = cachedAudio;
      if (!audioToPlay.paused) {
        audioToPlay.currentTime = 0;
      }
    }

    audioToPlay.loop = loop;
    audioToPlay.volume = volume;
    
    const playPromise = audioToPlay.play();
    if (playPromise !== undefined) {
      playPromise.catch(e => {
        if (e.name !== 'AbortError') {
          console.warn(`Audio play failed for ${soundKey}:`, e);
        }
      });
    }

    return audioToPlay;
  }, [isMuted]);

  const startBonusTheme = useCallback(() => {
    if (isMuted) return;
    if (bonusThemeRef.current) return;
    bonusThemeRef.current = playSound('freeSpinsTheme', { loop: true });
  }, [isMuted, playSound]);

  const stopBonusTheme = useCallback(() => {
    if (bonusThemeRef.current) {
      bonusThemeRef.current.pause();
      bonusThemeRef.current.currentTime = 0;
      bonusThemeRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isMuted) {
      stopBonusTheme();
    }
  }, [isMuted, stopBonusTheme]);

  const lastTumbleTime = useRef(0);
  const playStoneTumble = useCallback(() => {
    const now = Date.now();
    if (now - lastTumbleTime.current < 35) return; 
    lastTumbleTime.current = now;

    const audio = playSound('stoneTumble', { volume: 0.5, forceNew: true });
    if (audio) {
      audio.playbackRate = 1.3; 
    }
  }, [playSound]);

  return {
    isMuted,
    isLoaded,
    toggleMute,
    playStoneTumble,
    playSparkleWin: () => playSound('sparkleWin'),
    playLightningHit: () => playSound('lightningHit'),
    playEpicDrop: () => playSound('epicDrop'),
    playBigWin: () => playSound('bigWin', { volume: 0.8 }),
    playMegaWin: () => playSound('megaWin'),
    playUltraWin: () => playSound('ultraWin'),
    playAnteToggle: () => playSound('anteToggle'),
    playSymbolExplode: () => playSound('symbolExplode', { volume: 0.6 }),
    playCollectMultiplier: () => playSound('collectMultiplier'),
    playWinTick: () => playSound('winTick', { volume: 0.5 }),
    playScatterImpact: () => playSound('scatterImpact'),
    startBonusTheme,
    stopBonusTheme,
  };
};

export default useGameAudio;
