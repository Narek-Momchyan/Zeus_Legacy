import { useState, useRef, useEffect, useCallback } from 'react';

const BET_STEPS = [0.20, 0.50, 1.00, 2.00, 5.00, 10.00, 20.00, 50.00, 100.00];
const DEFAULT_BET_IDX = 2; // $1.00
const STARTING_BALANCE = 1000.0;
const ROWS = 5;
const COLS = 6;

function mapGrid(backendGrid) {
  if (!backendGrid) return [];
  return backendGrid.map(row =>
    row.map(sym => ({
      sym,
      uid: Math.random().toString(36).substr(2, 9)
    }))
  );
}

export default function useGameState() {
  // ── Grid ──────────────────────────────────────────────────────────────
  const [grid, setGrid] = useState(() => mapGrid(Array.from({ length: ROWS }, () => Array(COLS).fill('blue_gem'))));
  const [winningCoords, setWinningCoords] = useState([]);

  // ── Spin state ────────────────────────────────────────────────────────
  const [isSpinning, setIsSpinning] = useState(false);
  const isSpinningRef = useRef(false);
  const isSkippingRef = useRef(false);
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
  const raiseBet = useCallback(() => { if (!isMaxBet && !isSpinning) setBetIdx(i => i + 1); }, [isMaxBet, isSpinning]);
  const lowerBet = useCallback(() => { if (!isMinBet && !isSpinning) setBetIdx(i => i - 1); }, [isMinBet, isSpinning]);

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

  // Sync refs
  useEffect(() => { isBonusRef.current = isBonusMode; }, [isBonusMode]);
  useEffect(() => { globalMultRef.current = globalMultiplier; }, [globalMultiplier]);
  useEffect(() => { speedModeRef.current = speedMode; }, [speedMode]);

  const updateBonusWinStorage = useCallback((amount) => {
    if (typeof window !== 'undefined') {
      if (amount === null) localStorage.removeItem('slot_bonus_total_win');
      else localStorage.setItem('slot_bonus_total_win', String(amount));
    }
  }, []);

  // Quick reset for a new spin
  const resetForSpin = useCallback((isFreeSpin) => {
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
  }, []);

  return {
    grid, setGrid,
    winningCoords, setWinningCoords,
    isSpinning, setIsSpinning,
    isSpinningRef, isSkippingRef,
    tumbleCount, setTumbleCount,
    speedMode, setSpeedMode, speedModeRef,
    autoSpinsLeft, setAutoSpinsLeft,
    totalWin, setTotalWin,
    lastRoundWin, setLastRoundWin,
    lastWinAmount, setLastWinAmount,
    showWinModal, setShowWinModal,
    balance, setBalance,
    isBalanceLoading, setIsBalanceLoading,
    betIdx, setBetIdx, betAmount,
    isMinBet, isMaxBet, raiseBet, lowerBet,
    activeMultipliers, setActiveMultipliers,
    globalMultiplier, setGlobalMultiplier, globalMultRef,
    isBonusMode, setIsBonusMode, isBonusRef,
    isAnteBetActive, setIsAnteBetActive,
    freeSpinsLeft, setFreeSpinsLeft,
    showBonusTrigger, setShowBonusTrigger,
    showBonusSummary, setShowBonusSummary,
    bonusTotalWin, setBonusTotalWin,
    jackpotPools, setJackpotPools,
    jackpotWon, setJackpotWon,
    isLightningActive, setIsLightningActive,
    shouldShake, setShouldShake,
    showParticles, setShowParticles,
    updateBonusWinStorage,
    resetForSpin,
    mapGrid,
  };
}
