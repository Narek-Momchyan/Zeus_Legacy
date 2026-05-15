import { useState, useCallback, useEffect, useRef } from 'react';
import useGameAudio from './useGameAudio';
import { spinRequest, fetchBalance } from '../api/gameApi';

// ═══════════════════════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const COLS = 6;
const ROWS = 5;

const BET_STEPS = [0.20, 0.50, 1.00, 2.00, 5.00, 10.00, 20.00, 50.00, 100.00];
const DEFAULT_BET_IDX = 2; // $1.00
const STARTING_BALANCE = 1000.0;

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
  const [grid, setGrid]               = useState(() => mapGrid(Array.from({ length: ROWS }, () => Array(COLS).fill('blue_gem'))));
  const [winningCoords, setWinningCoords] = useState([]);

  // ── Spin state ────────────────────────────────────────────────────────
  const [isSpinning, setIsSpinning]   = useState(false);
  const isSpinningRef                 = useRef(false);
  const [tumbleCount, setTumbleCount] = useState(0);

  // ── Win amounts ───────────────────────────────────────────────────────
  const [totalWin, setTotalWin]         = useState(0);   // accumulates during tumble
  const [lastRoundWin, setLastRoundWin] = useState(0);   // shown after spin
  const [lastWinAmount, setLastWinAmount] = useState(0); // for modal
  const [showWinModal, setShowWinModal] = useState(false);

  // ── Balance & Bet ─────────────────────────────────────────────────────
  const [balance, setBalance] = useState(STARTING_BALANCE);
  const [isBalanceLoading, setIsBalanceLoading] = useState(true);
  const [betIdx, setBetIdx]   = useState(DEFAULT_BET_IDX);
  const betAmount = BET_STEPS[betIdx];
  const isMinBet  = betIdx === 0;
  const isMaxBet  = betIdx === BET_STEPS.length - 1;
  const raiseBet  = () => { if (!isMaxBet && !isSpinning) setBetIdx(i => i + 1); };
  const lowerBet  = () => { if (!isMinBet && !isSpinning) setBetIdx(i => i - 1); };

  // ── Multipliers ───────────────────────────────────────────────────────
  const [activeMultipliers, setActiveMultipliers] = useState([]);
  const [globalMultiplier, setGlobalMultiplier]   = useState(1);
  const globalMultRef = useRef(1);

  // ── Bonus round ───────────────────────────────────────────────────────
  const [isBonusMode, setIsBonusMode]         = useState(false);
  const [isAnteBetActive, setIsAnteBetActive] = useState(false);
  const [freeSpinsLeft, setFreeSpinsLeft]     = useState(0);
  const [showBonusTrigger, setShowBonusTrigger] = useState(false);
  const [showBonusSummary, setShowBonusSummary] = useState(false);
  const [bonusTotalWin, setBonusTotalWin]     = useState(0);
  const isBonusRef = useRef(false);

  // ── FX ────────────────────────────────────────────────────────────────
  const [isLightningActive, setIsLightningActive] = useState(false);
  const [shouldShake, setShouldShake]   = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  // ── Audio ─────────────────────────────────────────────────────────────
  const {
    isMuted, isLoaded, toggleMute,
    playStoneTumble, playSparkleWin, playZeusLightning, playEpicDrop, playBigWin,
    playMegaWin, playUltraWin, playAnteToggle, playSymbolExplode, playCollectMultiplier,
    playWinTick, playScatterImpact, startBonusTheme, stopBonusTheme,
  } = useGameAudio();

  // Keep refs in sync with state so async callbacks see latest values
  useEffect(() => { isBonusRef.current    = isBonusMode;    }, [isBonusMode]);
  useEffect(() => { globalMultRef.current = globalMultiplier; }, [globalMultiplier]);
  
  // Fetch initial balance
  useEffect(() => {
    fetchBalance()
      .then(setBalance)
      .catch(() => {})
      .finally(() => setIsBalanceLoading(false));
  }, []);

  // ─────────────────────────────────────────────────────────────────────
  //  SPIN (Backend Driven)
  // ─────────────────────────────────────────────────────────────────────
  const spin = useCallback(async (options = {}) => {
    if (isSpinningRef.current) return;
    
    const isBuyBonus = options.isBuyBonus === true;
    const isFreeSpin = isBonusRef.current;

    isSpinningRef.current = true;
    setIsSpinning(true);

    // Reset UI for new spin
    setWinningCoords([]);
    setActiveMultipliers([]);
    setTotalWin(0);
    setTumbleCount(0);
    setShouldShake(false);
    setShowParticles(false);

    try {
      // 1. Request spin from Backend
      const result = await spinRequest({
        bet_amount: betAmount,
        is_free_spin: isFreeSpin,
        is_buy_bonus: isBuyBonus,
        is_ante_bet: isAnteBetActive,
        global_multiplier: globalMultRef.current
      });

      // 2. Playback Backend Result
      // Initial Grid
      const initialGrid = mapGrid(result.initial_grid);
      setGrid(initialGrid);
      
      // Check for scatters in initial grid
      if (result.initial_grid.flat().includes('scatter')) {
        setTimeout(() => playScatterImpact(), 300);
      }
      
      await delay(600);

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
            playZeusLightning();
            playCollectMultiplier();
            setIsLightningActive(true);
            setTimeout(() => setIsLightningActive(false), 800);
            setActiveMultipliers(prev => [...prev, step.multiplier]);
          }

          currentTotalWin += step.payout;
          setTotalWin(currentTotalWin);

          // Real casino wait: Let the player SEE the win
          await delay(1200); 

          // Clear wins and drop new symbols
          setWinningCoords([]);
          setGrid(mapGrid(step.next_grid));
          
          if (step.next_grid.flat().includes('scatter')) {
             setTimeout(() => playScatterImpact(), 300);
          }

          await delay(700); 
        }
      }

      await delay(500); // Final pause before balance sync

      // 3. Finalize Spin
      if (isFreeSpin) {
        setGlobalMultiplier(result.global_multiplier_value);
        globalMultRef.current = result.global_multiplier_value;
      } else {
        // Base game: Multiplier resets after spin
        setGlobalMultiplier(1);
        globalMultRef.current = 1;
      }
      setLastRoundWin(result.total_win);
      setBalance(result.current_balance); // Sync with backend balance
      setTotalWin(result.total_win);

      if (isFreeSpin) {
        setFreeSpinsLeft(prev => {
          const next = prev - 1;
          if (next <= 0) {
            setBonusTotalWin(totalWin + result.total_win);
            setTimeout(() => {
              setShowBonusSummary(true);
              setIsBonusMode(false);
              stopBonusTheme();
            }, 1500);
          }
          return next;
        });
      }

      if (result.triggered_free_spins) {
        setIsBonusMode(true);
        setFreeSpinsLeft(15);
        setShowBonusTrigger(true);
        startBonusTheme();
      }

      if (result.total_win >= betAmount * 10) {
        setLastWinAmount(result.total_win);
        setShowWinModal(true);

        const mult = result.total_win / betAmount;
        if (mult >= 100) playUltraWin();
        else if (mult >= 50) playMegaWin();
        else playBigWin();
      }

    } catch (err) {
      console.error("Spin failed:", err);
    } finally {
      setIsSpinning(false);
      isSpinningRef.current = false;
    }
  }, [betAmount, isAnteBetActive, playScatterImpact, playSymbolExplode, playSparkleWin, playZeusLightning, playCollectMultiplier, stopBonusTheme, startBonusTheme, playUltraWin, playMegaWin, playBigWin]);

  // ── Bonus Completion Check ───────────────────────────────────────────────
  useEffect(() => {
    if (freeSpinsLeft === 0 && isBonusMode && !isSpinning) {
      const t = setTimeout(() => {
        setShowBonusSummary(true);
        setIsBonusMode(false);
        isBonusRef.current = false;
        setGlobalMultiplier(1);
        globalMultRef.current = 1;
        stopBonusTheme();
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [freeSpinsLeft, isSpinning, isBonusMode, stopBonusTheme]);

  // ─────────────────────────────────────────────────────────────────────
  //  BUY BONUS
  // ─────────────────────────────────────────────────────────────────────
  const buyBonusCost = betAmount * 100;
  const canBuyBonus = balance >= buyBonusCost && !isSpinning;

  const buyBonus = useCallback(async () => {
    if (!canBuyBonus) return;
    await spin({ isBuyBonus: true });
  }, [canBuyBonus, spin]);

  // ─────────────────────────────────────────────────────────────────────
  return {
    grid,
    winningCoords,
    isSpinning,
    spin,
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
  };
};

export default useSlotEngine;
