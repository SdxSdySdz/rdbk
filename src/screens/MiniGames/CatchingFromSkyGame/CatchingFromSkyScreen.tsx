import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMiniGameStore } from '../../../stores/miniGameStore';
import { useGameStore } from '../../../stores/gameStore';
import { audioService, AUDIO } from '../../../services/audioService';
import { CATCHING_FROM_SKY_LEVELS } from '../../../constants/miniGames';
import styles from './CatchingFromSkyScreen.module.css';

// ─── Canvas dimensions ────────────────────────────────────────────────────────
const CANVAS_W = 390;
const CANVAS_H = 600;

// ─── Hero ─────────────────────────────────────────────────────────────────────
const HERO_W = 56;
const HERO_H = 56;
const HERO_Y = CANVAS_H - HERO_H - 80; // above controls
const HERO_SPEED = 210; // px/s

// ─── Falling objects ──────────────────────────────────────────────────────────
const COIN_RADIUS = 14;
const SPIKE_HALF = 14;
const FALL_SPEED_BASE = 160; // px/s – scaled by level

interface FallingObj {
  id: number;
  x: number;
  y: number;
  type: 'coin' | 'spike';
}

// ─── Stars (background decoration) ───────────────────────────────────────────
interface Star {
  x: number;
  y: number;
  r: number;
  alpha: number;
}

function buildStars(): Star[] {
  const arr: Star[] = [];
  for (let i = 0; i < 60; i++) {
    arr.push({
      x: Math.random() * CANVAS_W,
      y: Math.random() * CANVAS_H,
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.6 + 0.2,
    });
  }
  return arr;
}

// ─── Component ────────────────────────────────────────────────────────────────
const CatchingFromSkyScreen: React.FC = () => {
  const navigate = useNavigate();
  const { level: levelParam } = useParams<{ level: string }>();
  const levelNumber = parseInt(levelParam ?? '1', 10);

  const levelCfg = CATCHING_FROM_SKY_LEVELS.find((l) => l.number === levelNumber)
    ?? CATCHING_FROM_SKY_LEVELS[0];

  // ── Store ──
  const phase       = useMiniGameStore((s) => s.phase);
  const score       = useMiniGameStore((s) => s.score);
  const heroHealth  = useMiniGameStore((s) => s.heroHealth);
  const startGame   = useMiniGameStore((s) => s.startGame);
  const pauseGame   = useMiniGameStore((s) => s.pauseGame);
  const resumeGame  = useMiniGameStore((s) => s.resumeGame);
  const addScore    = useMiniGameStore((s) => s.addScore);
  const completeLevel = useMiniGameStore((s) => s.completeLevel);
  const damageHero  = useMiniGameStore((s) => s.damageHero);
  const exitGame    = useMiniGameStore((s) => s.exitGame);

  // ── Canvas & refs ──
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const rafRef         = useRef<number>(0);
  const lastTimeRef    = useRef<number>(0);

  // Game-state refs (mutable, not triggering re-renders)
  const heroXRef       = useRef<number>(CANVAS_W / 2 - HERO_W / 2);
  const dirRef         = useRef<number>(0); // -1 left, 0 still, +1 right
  const objsRef        = useRef<FallingObj[]>([]);
  const timerRef       = useRef<number>(levelCfg.completionTime);
  const spawnTimerRef  = useRef<number>(0);
  const spikeTimerRef  = useRef<number>(0);
  const objIdRef       = useRef<number>(0);
  const starsRef       = useRef<Star[]>(buildStars());
  const phaseRef       = useRef<string>('idle');

  // Track local finished state to avoid calling store multiple times
  const finishedRef = useRef<boolean>(false);

  // Button press state
  const [leftActive, setLeftActive]  = useState(false);
  const [rightActive, setRightActive] = useState(false);

  // ── Derived fall speed ──
  const fallSpeed = FALL_SPEED_BASE + (levelNumber - 1) * 30;
  const coinSpawnInterval = Math.max(0.6, 1.4 - (levelNumber - 1) * 0.15); // seconds
  const spikeSpawnInterval = 1 / levelCfg.spikeSpawnRate;

  // ── Start on mount ──
  useEffect(() => {
    startGame('CatchingFromSky', levelNumber, levelCfg.heroHealthCount);
    audioService.playBGM(AUDIO.bgmDungeon);
    return () => {
      audioService.stopBGM();
      cancelAnimationFrame(rafRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Keyboard input ──
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft'  || e.key === 'a') dirRef.current = -1;
      if (e.key === 'ArrowRight' || e.key === 'd') dirRef.current =  1;
      if (e.key === 'Escape') {
        if (phaseRef.current === 'playing') pauseGame();
        else if (phaseRef.current === 'paused') resumeGame();
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if ((e.key === 'ArrowLeft'  || e.key === 'a') && dirRef.current === -1) dirRef.current = 0;
      if ((e.key === 'ArrowRight' || e.key === 'd') && dirRef.current ===  1) dirRef.current = 0;
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [pauseGame, resumeGame]);

  // ── Sync phaseRef with store phase ──
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // ── Main game loop ──
  const tick = useCallback((timestamp: number) => {
    rafRef.current = requestAnimationFrame(tick);

    const phase = phaseRef.current;
    if (phase !== 'playing') {
      lastTimeRef.current = timestamp;
      return;
    }

    const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = timestamp;

    if (finishedRef.current) return;

    const store = useMiniGameStore.getState();

    // ── Move hero ──
    heroXRef.current += dirRef.current * HERO_SPEED * dt;
    heroXRef.current = Math.max(0, Math.min(CANVAS_W - HERO_W, heroXRef.current));

    // ── Countdown timer ──
    timerRef.current -= dt;
    if (timerRef.current <= 0) {
      timerRef.current = 0;
      finishedRef.current = true;
      audioService.playSFX(AUDIO.levelCompleted);
      useGameStore.getState().addMoney(store.score);
      store.completeLevel();
      return;
    }

    // ── Spawn coins ──
    spawnTimerRef.current += dt;
    if (spawnTimerRef.current >= coinSpawnInterval) {
      spawnTimerRef.current = 0;
      objsRef.current.push({
        id: objIdRef.current++,
        x: COIN_RADIUS + Math.random() * (CANVAS_W - COIN_RADIUS * 2),
        y: -COIN_RADIUS,
        type: 'coin',
      });
    }

    // ── Spawn spikes ──
    spikeTimerRef.current += dt;
    if (spikeTimerRef.current >= spikeSpawnInterval) {
      spikeTimerRef.current = 0;
      objsRef.current.push({
        id: objIdRef.current++,
        x: SPIKE_HALF + Math.random() * (CANVAS_W - SPIKE_HALF * 2),
        y: -SPIKE_HALF,
        type: 'spike',
      });
    }

    // ── Move & collide objects ──
    const hx = heroXRef.current;
    const newObjs: FallingObj[] = [];

    for (const obj of objsRef.current) {
      obj.y += fallSpeed * dt;

      if (obj.y > CANVAS_H + 40) continue; // gone off screen

      // AABB check vs hero
      const heroLeft   = hx;
      const heroRight  = hx + HERO_W;
      const heroTop    = HERO_Y;
      const heroBottom = HERO_Y + HERO_H;

      let hit = false;
      if (obj.type === 'coin') {
        const cx = obj.x, cy = obj.y;
        if (cx + COIN_RADIUS > heroLeft && cx - COIN_RADIUS < heroRight
          && cy + COIN_RADIUS > heroTop  && cy - COIN_RADIUS < heroBottom) {
          hit = true;
          store.addScore(1);
          audioService.playSFX(AUDIO.coinPickup);
        }
      } else {
        // spike – treat as square hitbox
        const sx = obj.x - SPIKE_HALF, sy = obj.y - SPIKE_HALF;
        const sw = SPIKE_HALF * 2,      sh = SPIKE_HALF * 2;
        if (sx < heroRight && sx + sw > heroLeft
          && sy < heroBottom && sy + sh > heroTop) {
          hit = true;
          audioService.playSFX(AUDIO.heroHurt);
          store.damageHero();
          // damageHero already calls failLevel if hp→0
          if (store.heroHealth <= 1) {
            // next damage would kill; already set to 'failed' inside damageHero
            finishedRef.current = true;
            audioService.playSFX(AUDIO.levelFailed);
          }
        }
      }

      if (!hit) newObjs.push(obj);
    }

    objsRef.current = newObjs;

    // ── Draw ──
    drawFrame(store.score, store.heroHealth);

  }, [coinSpawnInterval, spikeSpawnInterval, fallSpeed]); // eslint-disable-line

  // ── Canvas drawing ──
  const drawFrame = useCallback((currentScore: number, currentHP: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    bg.addColorStop(0, '#0d0d1a');
    bg.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Stars
    for (const star of starsRef.current) {
      ctx.globalAlpha = star.alpha;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Ground line
    ctx.fillStyle = '#2a2a4e';
    ctx.fillRect(0, CANVAS_H - 78, CANVAS_W, 78);
    ctx.fillStyle = '#3a3a6e';
    ctx.fillRect(0, CANVAS_H - 78, CANVAS_W, 4);

    // Falling objects
    for (const obj of objsRef.current) {
      if (obj.type === 'coin') {
        // Gold coin
        ctx.save();
        const grad = ctx.createRadialGradient(obj.x - 4, obj.y - 4, 2, obj.x, obj.y, COIN_RADIUS);
        grad.addColorStop(0, '#ffe066');
        grad.addColorStop(1, '#c8860a');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, COIN_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // $ symbol
        ctx.fillStyle = '#7a4800';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', obj.x, obj.y);
        ctx.restore();
      } else {
        // Spike – downward triangle
        ctx.save();
        ctx.fillStyle = '#ff3333';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(obj.x, obj.y + SPIKE_HALF);          // bottom tip
        ctx.lineTo(obj.x - SPIKE_HALF, obj.y - SPIKE_HALF); // top-left
        ctx.lineTo(obj.x + SPIKE_HALF, obj.y - SPIKE_HALF); // top-right
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ff6666';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }
    }

    // Hero (bear – colored rect with ears)
    const hx = heroXRef.current;
    const hy = HERO_Y;
    ctx.save();
    // Body
    ctx.fillStyle = '#8B5E3C';
    ctx.beginPath();
    ctx.roundRect(hx, hy + 10, HERO_W, HERO_H - 10, 8);
    ctx.fill();
    // Head
    ctx.fillStyle = '#a0714f';
    ctx.beginPath();
    ctx.arc(hx + HERO_W / 2, hy + 14, 18, 0, Math.PI * 2);
    ctx.fill();
    // Ears
    ctx.fillStyle = '#8B5E3C';
    ctx.beginPath();
    ctx.arc(hx + 10, hy + 2, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(hx + HERO_W - 10, hy + 2, 7, 0, Math.PI * 2);
    ctx.fill();
    // Eyes
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(hx + HERO_W / 2 - 6, hy + 12, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(hx + HERO_W / 2 + 6, hy + 12, 3, 0, Math.PI * 2);
    ctx.fill();
    // Nose
    ctx.fillStyle = '#4a2a0a';
    ctx.beginPath();
    ctx.ellipse(hx + HERO_W / 2, hy + 18, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // Arms
    ctx.fillStyle = '#a0714f';
    ctx.fillRect(hx - 8, hy + 20, 12, 22);
    ctx.fillRect(hx + HERO_W - 4, hy + 20, 12, 22);
    // Catch basket indicator (when moving)
    if (dirRef.current !== 0) {
      ctx.strokeStyle = '#ffd70088';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(hx - 4, hy, HERO_W + 8, HERO_H + 4);
      ctx.setLineDash([]);
    }
    ctx.restore();

    // HUD – timer
    ctx.fillStyle = timerRef.current < 10 ? '#ff4444' : '#ffd700';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`${Math.ceil(timerRef.current)}s`, CANVAS_W / 2, 14);

    // HUD – score
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 17px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Coins: ${currentScore}`, 12, 14);

    // HUD – health hearts
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i < levelCfg.heroHealthCount; i++) {
      ctx.globalAlpha = i < currentHP ? 1 : 0.25;
      ctx.fillText('❤️', CANVAS_W - 12 - i * 26, 10);
    }
    ctx.globalAlpha = 1;

  }, [levelCfg.heroHealthCount]);

  // ── Start RAF ──
  useEffect(() => {
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);

  // ── Overlay actions ──
  const handleBack = () => {
    exitGame();
    navigate('/mini-games');
  };

  const handlePlayAgain = () => {
    finishedRef.current = false;
    heroXRef.current    = CANVAS_W / 2 - HERO_W / 2;
    dirRef.current      = 0;
    objsRef.current     = [];
    timerRef.current    = levelCfg.completionTime;
    spawnTimerRef.current = 0;
    spikeTimerRef.current = 0;
    startGame('CatchingFromSky', levelNumber, levelCfg.heroHealthCount);
  };

  const handleResume = () => resumeGame();

  // ── Button press handlers ──
  const startLeft  = () => { dirRef.current = -1; setLeftActive(true);  };
  const startRight = () => { dirRef.current =  1; setRightActive(true); };
  const stopLeft   = () => { if (dirRef.current === -1) dirRef.current = 0; setLeftActive(false); };
  const stopRight  = () => { if (dirRef.current ===  1) dirRef.current = 0; setRightActive(false); };

  // ── Render ──
  const showPause    = phase === 'paused';
  const showComplete = phase === 'completed';
  const showFailed   = phase === 'failed';

  return (
    <div className={styles.container}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        width={CANVAS_W}
        height={CANVAS_H}
      />

      {/* Pause button */}
      {phase === 'playing' && (
        <button className={styles.pauseBtn} onClick={pauseGame}>⏸</button>
      )}

      {/* On-screen controls */}
      {(phase === 'playing' || phase === 'paused') && (
        <div className={styles.controls}>
          <button
            className={`${styles.ctrlBtn} ${leftActive ? styles.ctrlBtnActive : ''}`}
            onPointerDown={startLeft}
            onPointerUp={stopLeft}
            onPointerLeave={stopLeft}
          >
            ◀
          </button>
          <button
            className={`${styles.ctrlBtn} ${rightActive ? styles.ctrlBtnActive : ''}`}
            onPointerDown={startRight}
            onPointerUp={stopRight}
            onPointerLeave={stopRight}
          >
            ▶
          </button>
        </div>
      )}

      {/* Pause overlay */}
      {showPause && (
        <div className={styles.overlay}>
          <div className={styles.overlayTitle}>Paused</div>
          <div className={styles.overlayScore}>Score: {score} coins</div>
          <button className={`${styles.overlayBtn} ${styles.btnGreen}`} onClick={handleResume}>
            ▶ Resume
          </button>
          <button className={`${styles.overlayBtn} ${styles.btnGray}`} onClick={handleBack}>
            ✕ Quit
          </button>
        </div>
      )}

      {/* Level complete overlay */}
      {showComplete && (
        <div className={styles.overlay}>
          <div className={styles.overlayTitle}>Level Complete!</div>
          <div className={styles.overlayScore}>+{score} coins earned</div>
          <div className={styles.levelBadge}>Level {levelNumber} finished</div>
          <button className={`${styles.overlayBtn} ${styles.btnBlue}`} onClick={handlePlayAgain}>
            ↺ Play Again
          </button>
          <button className={`${styles.overlayBtn} ${styles.btnGray}`} onClick={handleBack}>
            ← Back to Menu
          </button>
        </div>
      )}

      {/* Level failed overlay */}
      {showFailed && (
        <div className={styles.overlay}>
          <div className={styles.overlayTitle}>Game Over</div>
          <div className={styles.overlayScore}>Score: {score} coins</div>
          <div className={styles.overlaySubtext}>Don't give up!</div>
          <button className={`${styles.overlayBtn} ${styles.btnRed}`} onClick={handlePlayAgain}>
            ↺ Try Again
          </button>
          <button className={`${styles.overlayBtn} ${styles.btnGray}`} onClick={handleBack}>
            ← Back to Menu
          </button>
        </div>
      )}
    </div>
  );
};

export default CatchingFromSkyScreen;
