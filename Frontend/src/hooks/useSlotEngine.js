import { useState, useCallback, useEffect, useRef } from 'react';
import useGameAudio from './useGameAudio';
import { fetchGameConfig, resetWallet } from '../api/gameApi';

// ═══════════════════════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const COLS = 6;
const ROWS = 5;

const BET_STEPS = [0.20, 0.50, 1.00, 2.00, 5.00, 10.00, 20.00, 50.00, 100.00];
const DEFAULT_BET_IDX = 2; // $1.00
const STARTING_BALANCE = 1000.0;

const SPEED_CONFIGS = {
  normal: {
    initialDelay: 700, // Initial spin duration until reels stop
    winShowDelay: 1000, // Exploding wins animation time
    cascadeDelay: 900, // Drop new symbols cascade delay
    finalPause: 200    // Final pause before balance sync
  },
  turbo: {
    initialDelay: 400,
    winShowDelay: 600,
    cascadeDelay: 400,
    finalPause: 300
  },
  instant: {
    initialDelay: 100,
    winShowDelay: 150,
    cascadeDelay: 100,
    finalPause: 100
  }
};

// ═══════════════════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const delay = (ms) => new Promise(res => setTimeout(res, ms));

/** Converts backend string grid to frontend object grid with UIDs */
function mapGrid(backendGrid) {
  if (!backendGrid) return [];
  return backendGrid.map(row =>
    row.map(sym => ({
      sym,
      uid: Math.random().toString(36).substr(2, 9)
    }))
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  HOOK
// ═══════════════════════════════════════════════════════════════════════════

const useSlotEngine = () => {
  // ── Grid ──────────────────────────────────────────────────────────────
  const [grid, setGrid] = useState(() => mapGrid(Array.from({ length: ROWS }, () => Array(COLS).fill('blue_gem'))));
  const [winningCoords, setWinningCoords] = useState([]);

  // ── Spin state ────────────────────────────────────────────────────────
  const [isSpinning, setIsSpinning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const isSpinningRef = useRef(false);
  const isSkippingRef = useRef(false);
  const wsRef = useRef(null);
  const spinResolverRef = useRef(null);
  const [tumbleCount, setTumbleCount] = useState(0);
  const [speedMode, setSpeedMode] = useState('normal');
  const speedModeRef = useRef('normal');
  const [autoSpinsLeft, setAutoSpinsLeft] = useState(0);

  // ── Win amounts ───────────────────────────────────────────────────────
  const [totalWin, setTotalWin] = useState(0);   // accumulates during tumble
  const [lastRoundWin, setLastRoundWin] = useState(0);   // shown after spin
  const [lastWinAmount, setLastWinAmount] = useState(0); // for modal
  const [showWinModal, setShowWinModal] = useState(false);

  // ── Balance & Bet ─────────────────────────────────────────────────────
  const [balance, setBalance] = useState(STARTING_BALANCE);
  const [isBalanceLoading, setIsBalanceLoading] = useState(true);
  const [betIdx, setBetIdx] = useState(DEFAULT_BET_IDX);
  const betAmount = BET_STEPS[betIdx];
  const isMinBet = betIdx === 0;
  const isMaxBet = betIdx === BET_STEPS.length - 1;
  const raiseBet = () => { if (!isMaxBet && !isSpinning) setBetIdx(i => i + 1); };
  const lowerBet = () => { if (!isMinBet && !isSpinning) setBetIdx(i => i - 1); };

  // ── Multipliers ───────────────────────────────────────────────────────
  const [activeMultipliers, setActiveMultipliers] = useState([]);
  const [globalMultiplier, setGlobalMultiplier] = useState(1);
  const globalMultRef = useRef(1);

  // ── Bonus round ───────────────────────────────────────────────────────
  const [isBonusMode, setIsBonusMode] = useState(false);
  const [isAnteBetActive, setIsAnteBetActive] = useState(false);
  const [freeSpinsLeft, setFreeSpinsLeft] = useState(0);
  const [showBonusTrigger, setShowBonusTrigger] = useState(false);
  const [showBonusSummary, setShowBonusSummary] = useState(false);
  const [bonusTotalWin, setBonusTotalWin] = useState(0);
  const isBonusRef = useRef(false);

  // ── Jackpot state ─────────────────────────────────────────────────────
  const [jackpotPools, setJackpotPools] = useState({ mini: 100, minor: 500, major: 5000, grand: 50000 });
  const [jackpotWon, setJackpotWon] = useState(null); // { amount, tier }

  // ── FX ────────────────────────────────────────────────────────────────
  const [isLightningActive, setIsLightningActive] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  // ── Audio ─────────────────────────────────────────────────────────────
  const {
    isMuted, isLoaded, toggleMute,
    playStoneTumble, playSparkleWin, playLightningHit, playEpicDrop, playBigWin,
    playMegaWin, playUltraWin, playAnteToggle, playSymbolExplode, playCollectMultiplier,
    playWinTick, playScatterImpact, startBonusTheme, stopBonusTheme,
  } = useGameAudio();

  // Keep refs in sync with state so async callbacks see latest values
  useEffect(() => { isBonusRef.current = isBonusMode; }, [isBonusMode]);
  useEffect(() => { globalMultRef.current = globalMultiplier; }, [globalMultiplier]);
  useEffect(() => { speedModeRef.current = speedMode; }, [speedMode]);

  // ── WebSocket Connection & Game Config ────────────────────────────────
  useEffect(() => {
    let jackpotInterval = null;

    const connectWS = () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const wsUrl = apiUrl.replace(/^http/, 'ws') + '/ws/game/';
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        
        ws.onopen = () => {
          console.log('[WS] Connected to game socket');
          if (ws.readyState === WebSocket.OPEN) {
            setIsConnected(true);
            ws.send(JSON.stringify({ action: 'balance' }));
            ws.send(JSON.stringify({ action: 'jackpot' }));
          }
        };

        ws.onmessage = (event) => {
          try {
            const response = JSON.parse(event.data);
            console.log('[WS] Received:', response.action || response.error);
            
            // Reject any pending spin if there's a top-level error (like 'Unknown action')
            if (response.error && spinResolverRef.current) {
              spinResolverRef.current.reject(new Error(response.error));
              spinResolverRef.current = null;
              return;
            }
            
            if (response.action === 'balance_result') {
              const data = response.data;
              console.log('[WS] Balance data:', data);
              if (data && data.balance !== undefined) {
                setBalance(data.balance);
              }
              if (data && data.free_spins_left > 0) {
                setIsBonusMode(true);
                setFreeSpinsLeft(data.free_spins_left);
                setGlobalMultiplier(data.current_multiplier);
                startBonusTheme();
                
                if (typeof window !== 'undefined') {
                  const savedBonusWin = localStorage.getItem('slot_bonus_total_win');
                  if (savedBonusWin) {
                    setBonusTotalWin(parseFloat(savedBonusWin));
                  }
                }
              } else {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('slot_bonus_total_win');
                }
              }
              setIsBalanceLoading(false);
            } else if (response.action === 'jackpot_result') {
              if (response.data) {
                setJackpotPools(response.data);
              }
            } else if (response.action === 'spin_result') {
              // Resolve the pending spin promise
              if (spinResolverRef.current) {
                spinResolverRef.current.resolve(response);
                spinResolverRef.current = null;
              }
            } else if (response.action === 'spin_error') {
              // Reject the pending spin promise
              if (spinResolverRef.current) {
                spinResolverRef.current.reject(new Error(response.error || 'Spin failed'));
                spinResolverRef.current = null;
              }
            }
          } catch (e) {
            console.warn('[WS] Error parsing message:', e);
          }
        };

        ws.onerror = (err) => {
          console.warn('[WS] Connection error:', err);
          setIsConnected(false);
          setIsBalanceLoading(false); // don't hang UI
          // Reject any pending spin on WS error
          if (spinResolverRef.current) {
            spinResolverRef.current.reject(new Error('WebSocket error'));
            spinResolverRef.current = null;
          }
        };

        ws.onclose = () => {
          console.log('[WS] Disconnected');
          setIsConnected(false);
          wsRef.current = null;
          // Reject any pending spin on disconnect
          if (spinResolverRef.current) {
            spinResolverRef.current.reject(new Error('WebSocket disconnected'));
            spinResolverRef.current = null;
          }
          // Auto-reconnect logic
          setTimeout(connectWS, 3000);
        };
      } catch (err) {
        console.warn('[WS] Setup error:', err);
        setIsBalanceLoading(false);
      }
    };

    connectWS();

    // Poll jackpot every 3 seconds via WebSocket
    jackpotInterval = setInterval(() => {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: 'jackpot' }));
      }
    }, 3000);

    const loadConfig = () => {
      fetchGameConfig()
        .then(config => {
          if (config) {
            // Store symbols and PRELOAD them
            if (config.symbols) {
              const symRegistry = {};
              config.symbols.forEach(s => {
                if (s.image_url) {
                  symRegistry[s.symbol_id] = s.image_url;
                  // Preload to prevent "late rendering" on first spin
                  if (typeof window !== 'undefined') {
                    const img = new Image();
                    img.src = s.image_url;
                  }
                }
              });
              window.customSymbolImages = symRegistry;
            }
            // Store audios
            if (config.audios) {
              const audioRegistry = {};
              config.audios.forEach(a => {
                if (a.audio_url) {
                  audioRegistry[a.audio_id] = a.audio_url;
                }
              });
              if (audioRegistry.Lightning && !audioRegistry.lightningHit) {
                audioRegistry.lightningHit = audioRegistry.Lightning;
              }
              window.customGameAudios = audioRegistry;
            }
            if (config.hero_image_url) {
              window.customHeroImage = config.hero_image_url;
            }
            // Dispatch loaded event
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

    return () => {
      if (jackpotInterval) clearInterval(jackpotInterval);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);



  // ─────────────────────────────────────────────────────────────────────
  //  SPIN (Backend Driven)
  // ─────────────────────────────────────────────────────────────────────
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

    // Reset UI for new spin INSTANTLY for better responsiveness
    setGrid([]); 
    setWinningCoords([]);
    setActiveMultipliers([]);
    setTotalWin(0);
    setTumbleCount(0);
    setShouldShake(false);
    setShowParticles(false);

    if (!isFreeSpin) {
      setGlobalMultiplier(1);
      globalMultRef.current = 1;
    }

    // Smart delay that skips instantly if isSkippingRef is true
    const smartDelay = async (ms) => {
      const start = Date.now();
      while (Date.now() - start < ms) {
        if (isSkippingRef.current) return;
        await delay(50);
      }
    };

    try {
      // 1. Request spin from Backend via WebSocket
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.warn('WebSocket not connected, spin ignored.');
        setAutoSpinsLeft(0);
        return;
      }

      const result = await new Promise((resolve, reject) => {
        spinResolverRef.current = { resolve, reject };
        ws.send(JSON.stringify({
          action: 'spin',
          bet_amount: betAmount,
          is_buy_bonus: isBuyBonus,
          is_ante_bet: isAnteBetActive
        }));
        // Timeout safety: reject after 15 seconds
        setTimeout(() => {
          if (spinResolverRef.current) {
            spinResolverRef.current.reject(new Error('Spin request timed out'));
            spinResolverRef.current = null;
          }
        }, 15000);
      });

      // 2. Playback Backend Result
      // Initial Grid
      const initialGrid = mapGrid(result.initial_grid);
      setGrid(initialGrid);

      // Check for scatters in initial grid
      if (result.initial_grid.flat().includes('scatter')) {
        setTimeout(() => playScatterImpact(), 300);
      }

      const speed = SPEED_CONFIGS[speedModeRef.current];
      
      // Calculate Teaser Delay for Scatter tension
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
          if (sCount >= 3) {
            maxTeaserDelayMs += 2500; // 2.5s extra delay per teasing column
          }
          sCount += scattersInCol[c];
        }
      }

      await smartDelay(speed.initialDelay + maxTeaserDelayMs);

      // Tumbles
      let currentTotalWin = 0;
      for (const step of result.tumble_history) {
        if (step.winning_coords.length > 0) {
          setTumbleCount(step.step + 1);
          setWinningCoords(step.winning_coords);
          playSymbolExplode();
          playSparkleWin();
          setShouldShake(true);
          setTimeout(() => setShouldShake(false), 300);

          // Multiplier handling
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

          // Real casino wait: Let the player SEE the win
          await smartDelay(speed.winShowDelay);

          // Clear wins and drop new symbols
          setWinningCoords([]);
          setGrid(mapGrid(step.next_grid));

          if (step.next_grid.flat().includes('scatter')) {
            setTimeout(() => playScatterImpact(), 300);
          }

          await smartDelay(speed.cascadeDelay);
        }
      }

      await smartDelay(speed.finalPause); // Final pause before balance sync

      // 3. Finalize Spin
      // Sync State from backend exactly
      setGlobalMultiplier(result.current_multiplier);
      globalMultRef.current = result.current_multiplier;
      const wasFreeSpin = result.is_free_spin;
      setLastRoundWin(result.total_win);
      setBalance(result.current_balance); // Sync with backend balance
      setTotalWin(result.total_win);

      if (wasFreeSpin) {
        setBonusTotalWin(prev => {
          const next = prev + result.total_win;
          if (typeof window !== 'undefined') {
            localStorage.setItem('slot_bonus_total_win', String(next));
          }
          return next;
        });
      }
      
      setFreeSpinsLeft(result.free_spins_left);
      
      // Handle end of free spins
      if (wasFreeSpin && result.free_spins_left === 0) {
        const delay = (result.total_win >= betAmount * 10) ? 9500 : 1500;
        setTimeout(() => {
          setShowBonusSummary(true);
          setIsBonusMode(false);
          stopBonusTheme();
          if (typeof window !== 'undefined') {
            localStorage.removeItem('slot_bonus_total_win');
          }
        }, delay);
      }

      if (result.triggered_free_spins) {
        setBonusTotalWin(0);
        if (typeof window !== 'undefined') {
          localStorage.setItem('slot_bonus_total_win', '0');
        }
        setIsBonusMode(true);
        setFreeSpinsLeft(15);
        setShowBonusTrigger(true);
        startBonusTheme();
      }

      // Update jackpot pool from response (always)
      if (result.jackpot_pools) {
        setJackpotPools(result.jackpot_pools);
      }

      // Jackpot win
      if (result.jackpot_won) {
        setJackpotWon({ amount: result.jackpot_won, tier: result.jackpot_won_tier });
        setBalance(result.current_balance);
      }

      // Big Win Modal
      if (result.total_win >= betAmount * 10) {
        setLastWinAmount(result.total_win);
        setShowWinModal(true);
      }

    } catch (err) {
      console.warn("Spin failed:", err);
    } finally {
      setIsSpinning(false);
      isSpinningRef.current = false;
    }
  }, [betAmount, isAnteBetActive, playScatterImpact, playSymbolExplode, playSparkleWin, playLightningHit, playCollectMultiplier, stopBonusTheme, startBonusTheme, playUltraWin, playMegaWin, playBigWin]);

  // ─────────────────────────────────────────────────────────────────────
  //  AUTOPLAY LOGIC
  // ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    // If we have auto spins left, we're not spinning, not in bonus mode, and no modal is blocking...
    if (autoSpinsLeft > 0 && !isSpinning && !isBonusMode && !showWinModal && !showBonusSummary && !showBonusTrigger) {
      
      let waitTime = 1200;
      if (speedModeRef.current === 'turbo') waitTime = 400;
      if (speedModeRef.current === 'instant') waitTime = 100;

      const timer = setTimeout(() => {
        setAutoSpinsLeft(prev => prev - 1);
        spin();
      }, waitTime); // Dynamic wait based on speed mode
      
      return () => clearTimeout(timer);
    }
    // Stop autoplay if we enter bonus mode or run out of funds
    if (isBonusMode || (autoSpinsLeft > 0 && balance < betAmount && !isSpinning)) {
      setAutoSpinsLeft(0);
    }
  }, [autoSpinsLeft, isSpinning, isBonusMode, showWinModal, showBonusSummary, showBonusTrigger, spin, balance, betAmount]);


  // ── Bonus Completion Check ───────────────────────────────────────────────
  // ── Bonus Completion Check ───────────────────────────────────────────────
  // (Removed internal frontend free spin completion checker, handled in spin result)

  // ─────────────────────────────────────────────────────────────────────
  //  BUY BONUS
  // ─────────────────────────────────────────────────────────────────────
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
        if (typeof window !== 'undefined') {
          localStorage.removeItem('slot_bonus_total_win');
        }
        stopBonusTheme();
      }
    } catch (err) {
      console.warn("Error resetting wallet:", err);
    }
  }, [isSpinning, stopBonusTheme]);

  // ─────────────────────────────────────────────────────────────────────
  return {
    grid,
    winningCoords,
    isSpinning,
    spin,
    resetGame,
    tumbleCount,
    totalWin,
    lastRoundWin,
    lastWinAmount,
    showWinModal,
    setShowWinModal,
    balance,
    isBalanceLoading,
    betAmount,
    raiseBet,
    lowerBet,
    isMinBet,
    isMaxBet,
    activeMultipliers,
    globalMultiplier,
    isBonusMode,
    freeSpinsLeft,
    showBonusTrigger,
    setShowBonusTrigger,
    showBonusSummary,
    setShowBonusSummary,
    bonusTotalWin,
    isAnteBetActive,
    setIsAnteBetActive,
    buyBonus,
    buyBonusCost,
    canBuyBonus,
    isLightningActive,
    shouldShake,
    showParticles,
    playStoneTumble,
    playAnteToggle,
    isMuted,
    isLoaded,
    toggleMute,
    speedMode,
    setSpeedMode,
    autoSpinsLeft,
    setAutoSpinsLeft,
    jackpotPools,
    jackpotWon,
    setJackpotWon,
    isConnected,
  };
};

export default useSlotEngine;
