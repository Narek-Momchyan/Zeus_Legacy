"use client";

import React from 'react'
import dynamic from 'next/dynamic'
const SlotGrid = dynamic(() => import('../components/SlotGrid'), { ssr: false })
import useSlotEngine from '../hooks/useSlotEngine'
import { motion, AnimatePresence } from 'framer-motion'
import MultiplierBadge from '../components/MultiplierBadge'
import LightningBolt from '../components/LightningBolt'
import BigWinOverlay from '../components/BigWinOverlay'
import BonusSummary from '../components/BonusSummary'
import BonusTrigger from '../components/BonusTrigger'
import GlobalMultiplier from '../components/GlobalMultiplier'
import AnimatedNumber from '../components/AnimatedNumber'
import Particles from '../components/Particles'
import ZeusCharacter from '../components/ZeusCharacter'

function App() {
  const {
    grid, isSpinning, totalWin, tumbleCount, lastRoundWin, balance, isBalanceLoading,
    winningCoords, spin,
    activeMultipliers, isLightningActive, showWinModal,
    setShowWinModal, lastWinAmount,
    isBonusMode, freeSpinsLeft, globalMultiplier,
    isAnteBetActive, setIsAnteBetActive,
    showBonusTrigger, setShowBonusTrigger,
    showBonusSummary, setShowBonusSummary, bonusTotalWin,
    shouldShake, showParticles, playStoneTumble,
    betAmount, raiseBet, lowerBet, isMaxBet, isMinBet,
    buyBonus, buyBonusCost, canBuyBonus,
    isMuted, isLoaded, toggleMute, playAnteToggle,
    speedMode, setSpeedMode,
  } = useSlotEngine()

  const displayedBetAmount = isAnteBetActive ? betAmount * 1.25 : betAmount;

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        spin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [spin]);

  const spinBtnClass = isSpinning
    ? 'btn-disabled'
    : isBonusMode ? 'btn-bonus' : 'btn-spin'

  return (
    <div className={`app-container ${shouldShake ? 'shake' : ''}`}>
      {/* ── Fixed overlays ── */}
      <LightningBolt active={isLightningActive} />
      <GlobalMultiplier value={globalMultiplier} isBonusMode={isBonusMode} />
      <Particles active={showParticles} />

      {/* Mute */}
      <button
        id="mute-btn"
        onClick={toggleMute}
        style={{
          position: 'fixed', top: 12, right: 12, zIndex: 60,
          width: 34, height: 34, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          cursor: 'pointer', fontSize: '0.95rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(10px)',
        }}
      >
        {!isLoaded ? '🔊' : (isMuted ? '🔇' : '🔊')}
      </button>

      {/* ── Modals ── */}
      <AnimatePresence>
        {showWinModal     && <BigWinOverlay key="win-modal" amount={lastWinAmount} betAmount={betAmount} onComplete={() => setShowWinModal(false)} />}
        {showBonusTrigger && <BonusTrigger key="bonus-trigger" onComplete={() => setShowBonusTrigger(false)} />}
        {showBonusSummary && <BonusSummary key="bonus-summary" totalWin={bonusTotalWin} onClose={() => setShowBonusSummary(false)} />}
      </AnimatePresence>

      {/* ── HEADER — compact ── */}
      <header style={{ textAlign: 'center', padding: '7px 16px 3px', width: '100%', flexShrink: 0 }}>
        <motion.h1
          className={`font-olympus header-title ${isBonusMode ? '' : 'text-gold'}`}
          style={{
            fontSize: 'clamp(1rem, 2.8vw, 1.75rem)',
            fontWeight: 900, margin: 0, lineHeight: 1,
            ...(isBonusMode ? { color: '#c87fff', filter: 'drop-shadow(0 0 18px rgba(168,85,247,0.9))' } : {}),
          }}
          animate={isBonusMode ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          {isBonusMode ? '⚡ FREE SPINS ⚡' : 'Zeus Legacy'}
        </motion.h1>
        <div className="header-subtitle panel-label" style={{ marginTop: 2, fontSize: 8, color: isBonusMode ? 'rgba(200,140,255,0.45)' : undefined }}>
          {isBonusMode ? `${freeSpinsLeft} SPINS REMAINING` : 'PREMIUM · CASCADING · PAY ANYWHERE'}
        </div>
      </header>

      {/* ── GAME AREA ── */}
      <div className="game-area">

        {/* Left — collected multipliers */}
        <aside className="multiplier-panel">
          <span className="panel-label" style={{ textAlign: 'center' }}>Collected</span>
          <div className="multiplier-list">
            <AnimatePresence>
              {activeMultipliers.map((m, i) => <MultiplierBadge key={i} multiplier={m} />)}
            </AnimatePresence>
          </div>
          {activeMultipliers.length === 0 && (
            <div className="empty-multipliers">—</div>
          )}

          <div className="ante-bet-wrap">
             <button 
               onClick={() => {
                 if (!isSpinning && !isBonusMode) {
                   playAnteToggle();
                   setIsAnteBetActive(!isAnteBetActive);
                 }
               }}
               className={`glass ante-btn ${isAnteBetActive ? 'glow-gold active' : ''}`}
             >
               <span className="ante-label">ANTE BET</span>
               <div className="ante-switch">
                 <motion.div 
                    animate={{ x: isAnteBetActive ? 16 : 2 }}
                    className="ante-knob"
                    style={{ background: isAnteBetActive ? '#f5d060' : '#fff' }} 
                 />
               </div>
               <span className="ante-boost">+25%</span>
             </button>
          </div>
        </aside>

        {/* SLOT GRID + Tumble badge */}
        <div className="grid-container">

          {/* ── TUMBLE BADGE ── */}
          <AnimatePresence>
            {isSpinning && tumbleCount > 0 && (
              <motion.div
                key={tumbleCount}
                initial={{ scale: 0.5, opacity: 0, y: 10 }}
                animate={{ scale: 1,   opacity: 1, y: 0  }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                style={{
                  position: 'absolute',
                  top: -12, left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 30,
                  background: 'linear-gradient(135deg, rgba(245,208,60,0.2), rgba(200,130,10,0.35))',
                  border: '1px solid rgba(245,208,60,0.6)',
                  borderRadius: '9999px',
                  padding: '3px 16px',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 0 20px rgba(245,208,60,0.4)',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  background: 'linear-gradient(135deg, #fff8b0, #f5d060)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>TUMBLE ×{tumbleCount}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <SlotGrid
            grid={grid}
            winningCoords={winningCoords}
            isBonusMode={isBonusMode}
            onSymbolLand={playStoneTumble}
            speedMode={speedMode}
          />
        </div>

        {/* Right — Zeus Character */}
        <aside className="zeus-panel">
          <ZeusCharacter isAttacking={isLightningActive} isBonusMode={isBonusMode} />
        </aside>
      </div>

      {/* ── CONTROLS ── */}
      <section className="controls-section">

        {/* ── HUD BAR: Balance | Last Win | Bet ── */}
        <div className={`hud-bar glass ${isBonusMode ? 'glow-purple' : 'glow-gold'}`}>

          {/* BALANCE */}
          <div className="hud-column balance-col">
            <div className="panel-label">Balance</div>
            <div className="stat-value text-gold">
              {isBalanceLoading ? (
                <span className="loading-text">Loading...</span>
              ) : (
                <>$<AnimatedNumber value={balance} /></>
              )}
            </div>
          </div>

          {/* LIVE WIN / LAST WIN */}
          <div className={`hud-column win-col ${((isSpinning && totalWin > 0) || (!isSpinning && lastRoundWin > 0)) ? 'active-win' : ''}`}>
            <div className="panel-label">
              {isSpinning && totalWin > 0 ? '⚡ Win!' : lastRoundWin > 0 ? '✦ Last Win' : 'Last Win'}
            </div>

            <AnimatePresence mode="wait">
              {(isSpinning ? totalWin : lastRoundWin) > 0 ? (
                <motion.div
                  key={isSpinning ? `live-${totalWin}` : `last-${lastRoundWin}`}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                  className="stat-value win-value"
                  style={{
                    filter: isSpinning && totalWin > 0
                      ? 'drop-shadow(0 0 10px rgba(245,208,60,0.9))'
                      : 'drop-shadow(0 0 6px rgba(245,208,60,0.5))',
                  }}
                >
                  +$<AnimatedNumber value={isSpinning ? totalWin : lastRoundWin} />
                </motion.div>
              ) : (
                <motion.div
                  key="zero"
                  className="stat-value zero-value"
                >—</motion.div>
              )}
            </AnimatePresence>

            {/* Flash on new win */}
            <AnimatePresence>
              {!isSpinning && lastRoundWin > 0 && (
                <motion.div
                  key={`flash-${lastRoundWin}`}
                  initial={{ opacity: 0.45 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.9 }}
                  className="win-flash"
                />
              )}
            </AnimatePresence>
          </div>

          {/* BET adjuster / Bonus × */}
          <div className="hud-column bet-col">
            <div className="panel-label">
              {isBonusMode ? 'Bonus ×' : 'Bet'}
            </div>

            {isBonusMode ? (
              <div className="stat-value bonus-mult-value">
                <span className="mult-symbol">×</span>
                <AnimatedNumber value={globalMultiplier} precision={0} />
              </div>
            ) : (
              <div className="bet-controls">
                {/* − */}
                <button
                  id="bet-lower"
                  onClick={lowerBet}
                  disabled={isMinBet || isSpinning}
                  className="bet-btn"
                >−</button>

                <div className="stat-value bet-value text-gold">
                  ${displayedBetAmount.toFixed(2)}
                </div>

                {/* + */}
                <button
                  id="bet-raise"
                  onClick={raiseBet}
                  disabled={isMaxBet || isSpinning}
                  className="bet-btn"
                >+</button>
              </div>
            )}
          </div>
        </div>

        {/* Speed Selector Row */}
        <div className="speed-selector-row glass" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', borderRadius: '12px', width: '100%', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255, 255, 255, 0.015)' }}>
          <span className="panel-label" style={{ fontSize: '9px', margin: 0 }}>Speed Mode</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {['normal', 'turbo', 'instant'].map((mode) => {
              const isActive = speedMode === mode;
              const emoji = mode === 'normal' ? '🐢' : mode === 'turbo' ? '⚡' : '🚀';
              const label = mode === 'normal' ? 'Normal' : mode === 'turbo' ? 'Turbo' : 'Instant';
              return (
                <button
                  key={mode}
                  disabled={isSpinning}
                  onClick={() => setSpeedMode(mode)}
                  style={{
                    padding: '5px 12px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: isActive ? (mode === 'normal' ? '#f5d060' : mode === 'turbo' ? '#a855f7' : '#ef4444') : 'rgba(255,255,255,0.06)',
                    background: isActive ? (mode === 'normal' ? 'rgba(245,208,60,0.15)' : mode === 'turbo' ? 'rgba(168,85,247,0.15)' : 'rgba(239,68,68,0.15)') : 'rgba(255,255,255,0.02)',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                    cursor: isSpinning ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? `0 0 12px ${mode === 'normal' ? 'rgba(245,208,60,0.2)' : mode === 'turbo' ? 'rgba(168,85,247,0.2)' : 'rgba(239,68,68,0.2)'}` : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <span>{emoji}</span>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
          {/* BUY BONUS button */}
          {!isBonusMode && (
            <motion.button
              whileHover={canBuyBonus ? { scale: 1.02 } : {}}
              whileTap={canBuyBonus ? { scale: 0.95 } : {}}
              disabled={!canBuyBonus || isSpinning}
              onClick={buyBonus}
              style={{
                flex: 1, padding: '14px 8px',
                fontSize: '0.85rem', fontWeight: 900,
                letterSpacing: '0.05em', textTransform: 'uppercase',
                border: '1px solid rgba(168,85,247,0.5)',
                background: (!canBuyBonus || isSpinning) ? 'rgba(168,85,247,0.1)' : 'linear-gradient(180deg, rgba(168,85,247,0.3) 0%, rgba(120,40,200,0.4) 100%)',
                color: (!canBuyBonus || isSpinning) ? 'rgba(255,255,255,0.3)' : '#fff',
                cursor: (!canBuyBonus || isSpinning) ? 'not-allowed' : 'pointer',
                borderRadius: '12px',
                boxShadow: (!canBuyBonus || isSpinning) ? 'none' : '0 4px 15px rgba(168,85,247,0.3)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
              }}
            >
              <span>Buy Bonus</span>
              <span style={{ fontSize: '0.7rem', color: '#e9d5ff' }}>${buyBonusCost.toFixed(2)}</span>
            </motion.button>
          )}

          {/* SPIN button */}
          <motion.button
            id="spin-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.975 }}
            disabled={false}
            onClick={spin}
            className={isBonusMode ? 'btn-bonus' : 'btn-spin'}
            style={{
              flex: 1.5, padding: '14px 0',
              fontSize: '1rem', fontWeight: 900,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              border: 'none',
              cursor: 'pointer',
              boxShadow: isBonusMode
                ? '0 4px 24px rgba(168,85,247,0.45)'
                : '0 4px 24px rgba(245,208,60,0.38)',
              borderRadius: '12px',
            }}
          >
            {isSpinning
              ? '🛑  STOP'
              : freeSpinsLeft > 0
                ? `🎰  SPIN (${freeSpinsLeft} left)`
                : '🎰   SPIN'
            }
          </motion.button>
        </div>
      </section>
    </div>
  )
}

export default App
