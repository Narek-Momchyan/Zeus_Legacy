import { useCallback, useEffect, useRef } from 'react';
import useGameAudio from './useGameAudio';
import useGameState from './useGameState';
import useGameSocket from './useGameSocket';
import { fetchGameConfig, resetWallet } from '../api/gameApi';

const SPEED_CONFIGS = {
  normal: { initialDelay: 700, winShowDelay: 1000, cascadeDelay: 900, finalPause: 200 },
  turbo: { initialDelay: 400, winShowDelay: 600, cascadeDelay: 400, finalPause: 300 },
  instant: { initialDelay: 100, winShowDelay: 150, cascadeDelay: 100, finalPause: 100 }
};

const delay = (ms) => new Promise(res => setTimeout(res, ms));

const useSlotEngine = () => {
  const gameState = useGameState();
  const {
    setGrid,
    setWinningCoords,
    isSpinning, setIsSpinning,
    isSpinningRef, isSkippingRef,
    setTumbleCount,
    speedModeRef,
    autoSpinsLeft, setAutoSpinsLeft,
    setTotalWin,
    setLastRoundWin,
    setLastWinAmount,
    showWinModal, setShowWinModal,
    balance, setBalance,
    setIsBalanceLoading,
    betAmount,
    setActiveMultipliers,
    setGlobalMultiplier, globalMultRef,
    isBonusMode, setIsBonusMode, isBonusRef,
    isAnteBetActive,
    setFreeSpinsLeft,
    showBonusTrigger, setShowBonusTrigger,
    showBonusSummary, setShowBonusSummary,
    setBonusTotalWin,
    setJackpotPools,
    setJackpotWon,
    setIsLightningActive,
    setShouldShake,
    updateBonusWinStorage,
    resetForSpin,
    mapGrid,
  } = gameState;

  const spinResolverRef = useRef(null);

  const {
    isMuted, isLoaded, toggleMute,
    playStoneTumble, playSparkleWin, playLightningHit, playAnteToggle, playSymbolExplode, playCollectMultiplier,
    playScatterImpact, startBonusTheme, stopBonusTheme,
  } = useGameAudio();

  // Handle incoming websocket messages
  const onMessage = useCallback((response) => {
    if (response.error && spinResolverRef.current) {
      spinResolverRef.current.reject(new Error(response.error));
      spinResolverRef.current = null;
      return;
    }
    
    if (response.action === 'balance_result') {
      const data = response.data;
      if (data && data.balance !== undefined) setBalance(data.balance);
      if (data && data.free_spins_left > 0) {
        setIsBonusMode(true);
        setFreeSpinsLeft(data.free_spins_left);
        setGlobalMultiplier(data.current_multiplier);
        startBonusTheme();
        
        if (typeof window !== 'undefined') {
          const savedBonusWin = localStorage.getItem('slot_bonus_total_win');
          if (savedBonusWin) setBonusTotalWin(parseFloat(savedBonusWin));
        }
      } else {
        updateBonusWinStorage(null);
      }
      setIsBalanceLoading(false);
    } else if (response.action === 'jackpot_result') {
      if (response.data) setJackpotPools(response.data);
    } else if (response.action === 'spin_result') {
      if (spinResolverRef.current) {
        spinResolverRef.current.resolve(response);
        spinResolverRef.current = null;
      }
    } else if (response.action === 'spin_error') {
      if (spinResolverRef.current) {
        spinResolverRef.current.reject(new Error(response.error || 'Spin failed'));
        spinResolverRef.current = null;
      }
    }
  }, [setBalance, setIsBonusMode, setFreeSpinsLeft, setGlobalMultiplier, startBonusTheme, setBonusTotalWin, updateBonusWinStorage, setIsBalanceLoading, setJackpotPools]);

  const onConnect = useCallback((ws) => {
    ws.send(JSON.stringify({ action: 'balance' }));
    ws.send(JSON.stringify({ action: 'jackpot' }));
  }, []);

  const onError = useCallback(() => {
    setIsBalanceLoading(false);
    if (spinResolverRef.current) {
      spinResolverRef.current.reject(new Error('WebSocket error'));
      spinResolverRef.current = null;
    }
  }, [setIsBalanceLoading]);

  const onDisconnect = useCallback(() => {
    if (spinResolverRef.current) {
      spinResolverRef.current.reject(new Error('WebSocket disconnected'));
      spinResolverRef.current = null;
    }
  }, []);

  const { isConnected, sendMessage } = useGameSocket({ onMessage, onConnect, onError, onDisconnect });

  useEffect(() => {
    let jackpotInterval = null;
    if (isConnected) {
      jackpotInterval = setInterval(() => {
        sendMessage({ action: 'jackpot' });
      }, 3000);
    }
    return () => { if (jackpotInterval) clearInterval(jackpotInterval); };
  }, [isConnected, sendMessage]);

  useEffect(() => {
    const loadConfig = () => {
      fetchGameConfig()
        .then(config => {
          if (config) {
            if (config.symbols) {
              const symRegistry = {};
              config.symbols.forEach(s => {
                if (s.image_url) {
                  symRegistry[s.symbol_id] = s.image_url;
                  if (typeof window !== 'undefined') {
                    const img = new Image();
                    img.src = s.image_url;
                  }
                }
              });
              window.customSymbolImages = symRegistry;
            }
            if (config.audios) {
              const audioRegistry = {};
              config.audios.forEach(a => {
                if (a.audio_url) audioRegistry[a.audio_id] = a.audio_url;
              });
              if (audioRegistry.Lightning && !audioRegistry.lightningHit) {
                audioRegistry.lightningHit = audioRegistry.Lightning;
              }
              window.customGameAudios = audioRegistry;
            }
            if (config.hero_image_url) window.customHeroImage = config.hero_image_url;
            window.dispatchEvent(new Event('gameConfigLoaded'));
          } else {
            setTimeout(loadConfig, 3000);
          }
        })
        .catch(err => {
          console.warn("Error loading game config:", err);
          setTimeout(loadConfig, 3000);
        });
    };
    loadConfig();
  }, []);

  const smartDelay = useCallback(async (ms) => {
    const start = Date.now();
    while (Date.now() - start < ms) {
      if (isSkippingRef.current) return;
      await delay(50);
    }
  }, [isSkippingRef]);

  const spin = useCallback(async (options = {}) => {
    if (isSpinningRef.current) {
      isSkippingRef.current = true;
      return;
    }

    const isBuyBonus = options.isBuyBonus === true;
    const isFreeSpin = isBonusRef.current;

    isSpinningRef.current = true;
    setIsSpinning(true);
    isSkippingRef.current = false;

    resetForSpin(isFreeSpin);

    try {
      if (!isConnected) {
        setAutoSpinsLeft(0);
        // Restore grid on failure
        const defaultGrid = mapGrid(Array.from({ length: 5 }, () => Array(6).fill('blue_gem')));
        setGrid(defaultGrid);
        throw new Error('WebSocket not connected, spin ignored.');
      }

      const result = await new Promise((resolve, reject) => {
        const currentResolver = { resolve, reject };
        spinResolverRef.current = currentResolver;
        sendMessage({
          action: 'spin',
          bet_amount: betAmount,
          is_buy_bonus: isBuyBonus,
          is_ante_bet: isAnteBetActive
        });
        setTimeout(() => {
          if (spinResolverRef.current === currentResolver) {
            currentResolver.reject(new Error('Spin request timed out'));
            spinResolverRef.current = null;
          }
        }, isBuyBonus ? 30000 : 15000);
      });

      const initialGrid = mapGrid(result.initial_grid);
      setGrid(initialGrid);

      if (result.initial_grid.flat().includes('scatter')) {
        setTimeout(() => playScatterImpact(), 300);
      }

      const speed = SPEED_CONFIGS[speedModeRef.current];
      
      let maxTeaserDelayMs = 0;
      if (speedModeRef.current === 'normal' && !isBuyBonus && !isFreeSpin) {
        const scattersInCol = [0,0,0,0,0,0];
        result.initial_grid.forEach(row => {
          row.forEach((cell, c) => {
            if (cell === 'scatter') scattersInCol[c]++;
          });
        });
        let sCount = 0;
        for (let c=0; c<6; c++) {
          if (sCount >= 3) maxTeaserDelayMs += 2500;
          sCount += scattersInCol[c];
        }
      }

      await smartDelay(speed.initialDelay + maxTeaserDelayMs);

      let currentTotalWin = 0;
      for (const step of result.tumble_history) {
        if (step.winning_coords.length > 0) {
          setTumbleCount(step.step + 1);
          setWinningCoords(step.winning_coords);
          playSymbolExplode();
          playSparkleWin();
          setShouldShake(true);
          setTimeout(() => setShouldShake(false), 300);

          if (step.multiplier) {
            playLightningHit();
            playCollectMultiplier();
            setIsLightningActive(true);
            setTimeout(() => setIsLightningActive(false), 800);
            setActiveMultipliers(prev => [...prev, step.multiplier]);
            setGlobalMultiplier(prev => prev + step.multiplier);
          }

          currentTotalWin += step.payout;
          setTotalWin(currentTotalWin);

          await smartDelay(speed.winShowDelay);

          setWinningCoords([]);
          setGrid(mapGrid(step.next_grid));

          if (step.next_grid.flat().includes('scatter')) {
            setTimeout(() => playScatterImpact(), 300);
          }

          await smartDelay(speed.cascadeDelay);
        }
      }

      await smartDelay(speed.finalPause);

      setGlobalMultiplier(result.current_multiplier);
      globalMultRef.current = result.current_multiplier;
      const wasFreeSpin = result.is_free_spin;
      setLastRoundWin(result.total_win);
      setBalance(result.current_balance);
      setTotalWin(result.total_win);

      if (wasFreeSpin) {
        setBonusTotalWin(prev => {
          const next = prev + result.total_win;
          updateBonusWinStorage(next);
          return next;
        });
      }
      
      setFreeSpinsLeft(result.free_spins_left);
      
      if (wasFreeSpin && result.free_spins_left === 0) {
        const d = (result.total_win >= betAmount * 10) ? 9500 : 1500;
        setTimeout(() => {
          setShowBonusSummary(true);
          setIsBonusMode(false);
          stopBonusTheme();
          updateBonusWinStorage(null);
        }, d);
      }

      if (result.triggered_free_spins) {
        if (!wasFreeSpin) {
          const initialWin = result.total_win || 0;
          setBonusTotalWin(initialWin);
          updateBonusWinStorage(initialWin);
          isBonusRef.current = true;
          setIsBonusMode(true);
          setFreeSpinsLeft(result.free_spins_left || 15);
          setShowBonusTrigger(true);
          startBonusTheme();
        } else {
          setShowBonusTrigger(true);
        }
      }

      if (result.jackpot_pools) setJackpotPools(result.jackpot_pools);
      if (result.jackpot_won) {
        setJackpotWon({ amount: result.jackpot_won, tier: result.jackpot_won_tier });
        setBalance(result.current_balance);
      }

      if (result.total_win >= betAmount * 10) {
        setLastWinAmount(result.total_win);
        setShowWinModal(true);
      }

    } catch (err) {
      console.warn("Spin failed:", err);
      // Restore grid visually if it failed before getting result
      setGrid(prev => prev.length === 0 ? mapGrid(Array.from({ length: 5 }, () => Array(6).fill('blue_gem'))) : prev);
    } finally {
      setIsSpinning(false);
      isSpinningRef.current = false;
    }
  }, [
    isSpinningRef, isSkippingRef, setIsSpinning, resetForSpin, isBonusRef, isConnected,
    setAutoSpinsLeft, sendMessage, betAmount, isAnteBetActive, mapGrid, setGrid, playScatterImpact,
    speedModeRef, smartDelay, setTumbleCount, setWinningCoords, playSymbolExplode, playSparkleWin,
    setShouldShake, playLightningHit, playCollectMultiplier, setIsLightningActive, setActiveMultipliers,
    setGlobalMultiplier, setTotalWin, globalMultRef, setLastRoundWin, setBalance, setBonusTotalWin,
    updateBonusWinStorage, setFreeSpinsLeft, setShowBonusSummary, setIsBonusMode, stopBonusTheme,
    setShowBonusTrigger, startBonusTheme, setJackpotPools, setJackpotWon, setLastWinAmount, setShowWinModal
  ]);

  useEffect(() => {
    if (autoSpinsLeft > 0 && !isSpinning && !showWinModal && !showBonusSummary && !showBonusTrigger) {
      let waitTime = 1200;
      if (speedModeRef.current === 'turbo') waitTime = 400;
      if (speedModeRef.current === 'instant') waitTime = 100;

      const timer = setTimeout(() => {
        setAutoSpinsLeft(prev => prev - 1);
        spin();
      }, waitTime);
      
      return () => clearTimeout(timer);
    }
    if (autoSpinsLeft > 0 && balance < betAmount && !isSpinning && !isBonusMode) {
      setAutoSpinsLeft(0);
    }
  }, [autoSpinsLeft, isSpinning, showWinModal, showBonusSummary, showBonusTrigger, speedModeRef, spin, balance, betAmount, isBonusMode, setAutoSpinsLeft]);

  const buyBonusCost = betAmount * 100;
  const canBuyBonus = balance >= buyBonusCost && !isSpinning;

  const buyBonus = useCallback(async () => {
    if (!canBuyBonus) return;
    await spin({ isBuyBonus: true });
  }, [canBuyBonus, spin]);

  const resetGame = useCallback(async () => {
    if (isSpinning) return;
    try {
      const data = await resetWallet();
      if (data) {
        setIsBonusMode(false);
        setFreeSpinsLeft(0);
        setGlobalMultiplier(1);
        globalMultRef.current = 1;
        setBalance(data.balance);
        setActiveMultipliers([]);
        setTumbleCount(0);
        setTotalWin(0);
        setLastRoundWin(0);
        setBonusTotalWin(0);
        updateBonusWinStorage(null);
        stopBonusTheme();
      }
    } catch (err) {
      console.warn("Error resetting wallet:", err);
    }
  }, [
    isSpinning, setIsBonusMode, setFreeSpinsLeft, setGlobalMultiplier, globalMultRef,
    setBalance, setActiveMultipliers, setTumbleCount, setTotalWin, setLastRoundWin,
    setBonusTotalWin, updateBonusWinStorage, stopBonusTheme
  ]);

  return {
    ...gameState,
    spin,
    resetGame,
    buyBonus,
    buyBonusCost,
    canBuyBonus,
    isMuted,
    isLoaded,
    toggleMute,
    playStoneTumble,
    playAnteToggle,
    isConnected,
  };
};

export default useSlotEngine;
