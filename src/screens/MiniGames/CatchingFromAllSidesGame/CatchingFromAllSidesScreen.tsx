import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMiniGameStore } from '../../../stores/miniGameStore';
import { useGameStore } from '../../../stores/gameStore';
import { audioService, AUDIO } from '../../../services/audioService';
import { CATCHING_FROM_ALL_SIDES_LEVELS } from '../../../constants/miniGames';
import styles from './CatchingFromAllSidesScreen.module.css';

// ─── Canvas ───────────────────────────────────────────────────────────────────
const CW = 390;
const CH = 600;

// ─── Hero (center) ────────────────────────────────────────────────────────────
const HERO_W = 64;
const HERO_H = 64;
const HERO_X = (CW - HERO_W) / 2;
const HERO_Y = (CH - HERO_H) / 2;
const HERO_CX = CW / 2;
const HERO_CY = CH / 2;

// ─── Chute lanes ──────────────────────────────────────────────────────────────
// Each direction: the coin starts far out and travels toward center
const LANE_THICKNESS = 44;
const CATCH_ZONE_DIST = 44; // distance from hero center where catch is checked

// ─── Coin ─────────────────────────────────────────────────────────────────────
const COIN_R = 14;
const COIN_SPEED = 180; // px/s

// ─── Zone active duration ─────────────────────────────────────────────────────
const ZONE_ACTIVE_MS = 500;

// ─── Direction types ──────────────────────────────────────────────────────────
type Dir = 'left' | 'right' | 'top' | 'bottom';

interface Coin {
  id: number;
  dir: Dir;
  pos: number; // distance from edge toward center (0 = at edge, max = at center)
  maxDist: number; // total travel distance (edge-to-center)
  caught: boolean;
  missed: boolean;
}

const DIR_LIST_2: Dir[] = ['left', 'right'];
const DIR_LIST_4: Dir[] = ['left', 'right', 'top', 'bottom'];

// Direction to starting position and velocity direction
function coinStartPos(dir: Dir): { x: number; y: number; vx: number; vy: number; maxDist: number } {
  switch (dir) {
    case 'left':   return { x: -COIN_R,     y: HERO_CY, vx:  1, vy: 0, maxDist: HERO_CX };
    case 'right':  return { x: CW + COIN_R, y: HERO_CY, vx: -1, vy: 0, maxDist: CW - HERO_CX };
    case 'top':    return { x: HERO_CX, y: -COIN_R,     vx: 0, vy:  1, maxDist: HERO_CY };
    case 'bottom': return { x: HERO_CX, y: CH + COIN_R, vx: 0, vy: -1, maxDist: CH - HERO_CY };
  }
}

// Direction label for buttons
const DIR_LABELS: Record<Dir, { icon: string; key: string }> = {
  left:   { icon: '◀', key: 'Q' },
  right:  { icon: '▶', key: 'E' },
  top:    { icon: '▲', key: 'W' },
  bottom: { icon: '▼', key: 'S' },
};

const DIR_KEYS: Record<string, Dir> = {
  q: 'left', a: 'left', arrowleft: 'left',
  e: 'right', d: 'right', arrowright: 'right',
  w: 'top', arrowup: 'top',
  s: 'bottom', arrowdown: 'bottom',
};

interface Star { x: number; y: number; r: number; alpha: number }
function buildStars(): Star[] {
  return Array.from({ length: 55 }, () => ({
    x: Math.random() * CW, y: Math.random() * CH,
    r: Math.random() * 1.4 + 0.4, alpha: Math.random() * 0.5 + 0.2,
  }));
}

// ─── Component ────────────────────────────────────────────────────────────────
const CatchingFromAllSidesScreen: React.FC = () => {
  const navigate = useNavigate();
  const { level: levelParam } = useParams<{ level: string }>();
  const levelNumber = parseInt(levelParam ?? '1', 10);
  const levelCfg = CATCHING_FROM_ALL_SIDES_LEVELS.find((l) => l.number === levelNumber)
    ?? CATCHING_FROM_ALL_SIDES_LEVELS[0];

  // Determine which directions are active
  const numChutes = levelCfg.coinChuteLevelsCount >= 2 ? 4 : 2;
  const activeDirections: Dir[] = numChutes === 4 ? DIR_LIST_4 : DIR_LIST_2;

  // ── Store ──
  const phase         = useMiniGameStore((s) => s.phase);
  const score         = useMiniGameStore((s) => s.score);
  const heroHealth    = useMiniGameStore((s) => s.heroHealth);
  const startGame     = useMiniGameStore((s) => s.startGame);
  const pauseGame     = useMiniGameStore((s) => s.pauseGame);
  const resumeGame    = useMiniGameStore((s) => s.resumeGame);
  const exitGame      = useMiniGameStore((s) => s.exitGame);

  // ── Canvas ──
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const rafRef         = useRef<number>(0);
  const lastTimeRef    = useRef<number>(0);
  const phaseRef       = useRef<string>('idle');
  const finishedRef    = useRef<boolean>(false);

  // Game state refs
  const coinsRef       = useRef<Coin[]>([]);
  const coinIdRef      = useRef<number>(0);
  const timerRef       = useRef<number>(levelCfg.completionTime);
  const spawnAccRef    = useRef<number>(0);
  const starsRef       = useRef<Star[]>(buildStars());

  // Active zones: direction → timestamp when it was activated (ms)
  const activeZonesRef = useRef<Partial<Record<Dir, number>>>({});

  // Tutorial hint
  const [showHint, setShowHint] = useState(true);

  // ── Spawn interval ──
  const spawnInterval = 1 / levelCfg.coinsSpawnRate;

  // ── Init ──
  useEffect(() => {
    startGame('CatchingFromAllSides', levelNumber, 3);
    audioService.playBGM(AUDIO.bgmDungeon);
    const hintTimeout = setTimeout(() => setShowHint(false), 3000);
    return () => {
      audioService.stopBGM();
      cancelAnimationFrame(rafRef.current);
      clearTimeout(hintTimeout);
    };
  }, []); // eslint-disable-line

  // ── Sync phaseRef ──
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // ── Zone activation ──
  const activateZone = useCallback((dir: Dir) => {
    if (!activeDirections.includes(dir)) return;
    activeZonesRef.current[dir] = Date.now();
  }, [activeDirections]);

  const isZoneActive = (dir: Dir, now: number): boolean => {
    const ts = activeZonesRef.current[dir];
    if (ts === undefined) return false;
    return now - ts < ZONE_ACTIVE_MS;
  };

  // ── Keyboard ──
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const dir = DIR_KEYS[e.key.toLowerCase()];
      if (dir) activateZone(dir);
      if (e.key === 'Escape') {
        if (phaseRef.current === 'playing') pauseGame();
        else if (phaseRef.current === 'paused') resumeGame();
      }
    };
    window.addEventListener('keydown', onDown);
    return () => window.removeEventListener('keydown', onDown);
  }, [activateZone, pauseGame, resumeGame]);

  // ── Game tick ──
  const tick = useCallback((timestamp: number) => {
    rafRef.current = requestAnimationFrame(tick);
    if (phaseRef.current !== 'playing') {
      lastTimeRef.current = timestamp;
      return;
    }
    const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = timestamp;
    if (finishedRef.current) return;

    const store = useMiniGameStore.getState();
    const now = Date.now();

    // ── Timer ──
    timerRef.current -= dt;
    if (timerRef.current <= 0) {
      timerRef.current = 0;
      finishedRef.current = true;
      audioService.playSFX(AUDIO.levelCompleted);
      useGameStore.getState().addMoney(store.score);
      store.completeLevel();
      return;
    }

    // ── Spawn ──
    spawnAccRef.current += dt;
    if (spawnAccRef.current >= spawnInterval) {
      spawnAccRef.current = 0;
      const dir = activeDirections[Math.floor(Math.random() * activeDirections.length)];
      const sp = coinStartPos(dir);
      coinsRef.current.push({
        id: coinIdRef.current++,
        dir,
        pos: 0,
        maxDist: sp.maxDist,
        caught: false,
        missed: false,
      });
    }

    // ── Move coins ──
    const alive: Coin[] = [];
    for (const coin of coinsRef.current) {
      if (coin.caught || coin.missed) continue;

      coin.pos += COIN_SPEED * dt;

      // Coin reaches center region
      if (coin.pos >= coin.maxDist - CATCH_ZONE_DIST) {
        if (isZoneActive(coin.dir, now)) {
          coin.caught = true;
          store.addScore(1);
          audioService.playSFX(AUDIO.coinPickup);
        } else if (coin.pos >= coin.maxDist + COIN_R) {
          coin.missed = true;
          // Missed coins don't damage (game design: just miss the point)
        }
      }

      if (!coin.caught && !coin.missed) alive.push(coin);
      else if (coin.caught) { /* remove */ }
      else if (coin.missed) { /* remove */ }
    }
    coinsRef.current = alive;

    // ── Draw ──
    renderFrame(store.score, store.heroHealth, now);
  }, [spawnInterval, activeDirections]); // eslint-disable-line

  // ── Render ──
  const renderFrame = useCallback((currentScore: number, currentHP: number, now: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, CH);
    bg.addColorStop(0, '#0d0d1a');
    bg.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CW, CH);

    // Stars
    for (const star of starsRef.current) {
      ctx.globalAlpha = star.alpha;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ── Chute lanes ──
    const drawLane = (dir: Dir, active: boolean) => {
      ctx.save();
      ctx.globalAlpha = active ? 0.25 : 0.09;
      ctx.fillStyle = active ? '#ffd700' : '#4466cc';

      switch (dir) {
        case 'left':   ctx.fillRect(0,         HERO_CY - LANE_THICKNESS / 2, HERO_CX, LANE_THICKNESS); break;
        case 'right':  ctx.fillRect(HERO_CX,   HERO_CY - LANE_THICKNESS / 2, HERO_CX, LANE_THICKNESS); break;
        case 'top':    ctx.fillRect(HERO_CX - LANE_THICKNESS / 2, 0,         LANE_THICKNESS, HERO_CY); break;
        case 'bottom': ctx.fillRect(HERO_CX - LANE_THICKNESS / 2, HERO_CY,  LANE_THICKNESS, CH - HERO_CY); break;
      }

      // Active glow border
      if (active) {
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        switch (dir) {
          case 'left':
            ctx.moveTo(0, HERO_CY - LANE_THICKNESS / 2);
            ctx.lineTo(HERO_CX, HERO_CY - LANE_THICKNESS / 2);
            ctx.moveTo(0, HERO_CY + LANE_THICKNESS / 2);
            ctx.lineTo(HERO_CX, HERO_CY + LANE_THICKNESS / 2);
            break;
          case 'right':
            ctx.moveTo(HERO_CX, HERO_CY - LANE_THICKNESS / 2);
            ctx.lineTo(CW, HERO_CY - LANE_THICKNESS / 2);
            ctx.moveTo(HERO_CX, HERO_CY + LANE_THICKNESS / 2);
            ctx.lineTo(CW, HERO_CY + LANE_THICKNESS / 2);
            break;
          case 'top':
            ctx.moveTo(HERO_CX - LANE_THICKNESS / 2, 0);
            ctx.lineTo(HERO_CX - LANE_THICKNESS / 2, HERO_CY);
            ctx.moveTo(HERO_CX + LANE_THICKNESS / 2, 0);
            ctx.lineTo(HERO_CX + LANE_THICKNESS / 2, HERO_CY);
            break;
          case 'bottom':
            ctx.moveTo(HERO_CX - LANE_THICKNESS / 2, HERO_CY);
            ctx.lineTo(HERO_CX - LANE_THICKNESS / 2, CH);
            ctx.moveTo(HERO_CX + LANE_THICKNESS / 2, HERO_CY);
            ctx.lineTo(HERO_CX + LANE_THICKNESS / 2, CH);
            break;
        }
        ctx.stroke();
      }
      ctx.restore();
    };

    for (const dir of activeDirections) {
      drawLane(dir, isZoneActive(dir, now));
    }

    // ── Draw coins ──
    for (const coin of coinsRef.current) {
      const sp = coinStartPos(coin.dir);
      const cx = sp.x + sp.vx * coin.pos;
      const cy = sp.y + sp.vy * coin.pos;

      ctx.save();
      const grad = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, COIN_R);
      grad.addColorStop(0, '#ffe066');
      grad.addColorStop(1, '#c8860a');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, COIN_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#7a4800';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', cx, cy);
      ctx.restore();
    }

    // ── Hero (bear, center) ──
    const hx = HERO_X;
    const hy = HERO_Y;
    ctx.save();
    // Glow if any zone active
    const anyActive = activeDirections.some((d) => isZoneActive(d, now));
    if (anyActive) {
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 18;
    }
    // Body
    ctx.fillStyle = '#8B5E3C';
    ctx.beginPath();
    ctx.roundRect(hx, hy + 12, HERO_W, HERO_H - 12, 8);
    ctx.fill();
    // Head
    ctx.fillStyle = '#a0714f';
    ctx.beginPath();
    ctx.arc(hx + HERO_W / 2, hy + 16, 20, 0, Math.PI * 2);
    ctx.fill();
    // Ears
    ctx.fillStyle = '#8B5E3C';
    ctx.beginPath();
    ctx.arc(hx + 11, hy + 3, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(hx + HERO_W - 11, hy + 3, 8, 0, Math.PI * 2);
    ctx.fill();
    // Eyes
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(hx + HERO_W / 2 - 7, hy + 13, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(hx + HERO_W / 2 + 7, hy + 13, 3, 0, Math.PI * 2);
    ctx.fill();
    // Nose
    ctx.fillStyle = '#4a2a0a';
    ctx.beginPath();
    ctx.ellipse(hx + HERO_W / 2, hy + 20, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ── Active zone glows around hero ──
    for (const dir of activeDirections) {
      if (!isZoneActive(dir, now)) continue;
      ctx.save();
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.8;
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 12;
      const pad = 6;
      switch (dir) {
        case 'left':
          ctx.beginPath();
          ctx.moveTo(hx - pad, hy);
          ctx.lineTo(hx - pad, hy + HERO_H);
          ctx.stroke();
          break;
        case 'right':
          ctx.beginPath();
          ctx.moveTo(hx + HERO_W + pad, hy);
          ctx.lineTo(hx + HERO_W + pad, hy + HERO_H);
          ctx.stroke();
          break;
        case 'top':
          ctx.beginPath();
          ctx.moveTo(hx, hy - pad);
          ctx.lineTo(hx + HERO_W, hy - pad);
          ctx.stroke();
          break;
        case 'bottom':
          ctx.beginPath();
          ctx.moveTo(hx, hy + HERO_H + pad);
          ctx.lineTo(hx + HERO_W, hy + HERO_H + pad);
          ctx.stroke();
          break;
      }
      ctx.restore();
    }

    // ── HUD ──
    ctx.fillStyle = timerRef.current < 10 ? '#ff4444' : '#ffd700';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`${Math.ceil(timerRef.current)}s`, CW / 2, 12);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${currentScore}`, 12, 14);

    // Hearts (top-right)
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'right';
    const maxHP = 3;
    for (let i = 0; i < maxHP; i++) {
      ctx.globalAlpha = i < currentHP ? 1 : 0.22;
      ctx.fillText('❤️', CW - 12 - i * 26, 10);
    }
    ctx.globalAlpha = 1;
  }, [activeDirections]);

  // ── Start RAF ──
  useEffect(() => {
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);

  // ── Navigation helpers ──
  const handleBack = () => { exitGame(); navigate('/mini-games'); };

  const handlePlayAgain = () => {
    finishedRef.current = false;
    coinsRef.current = [];
    timerRef.current = levelCfg.completionTime;
    spawnAccRef.current = 0;
    activeZonesRef.current = {};
    startGame('CatchingFromAllSides', levelNumber, 3);
    setShowHint(true);
    setTimeout(() => setShowHint(false), 3000);
  };

  const handleResume = () => resumeGame();

  // ── Zone button handlers ──
  const pressZone = (dir: Dir) => activateZone(dir);

  // ── Render ──
  const showPause    = phase === 'paused';
  const showComplete = phase === 'completed';
  const showFailed   = phase === 'failed';

  const getHintText = () => {
    if (numChutes === 4) return 'Press Q/A◀  E/D▶  W▲  S▼ to catch coins!';
    return 'Press Q/◀ to catch Left,  E/▶ to catch Right!';
  };

  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <canvas ref={canvasRef} className={styles.canvas} width={CW} height={CH} />

        {/* Pause btn */}
        {phase === 'playing' && (
          <button className={styles.pauseBtn} onClick={pauseGame}>⏸</button>
        )}

        {/* Tutorial hint */}
        {showHint && phase === 'playing' && (
          <div className={styles.tutorialHint}>{getHintText()}</div>
        )}

        {/* On-screen buttons */}
        {(phase === 'playing' || phase === 'paused') && (
          <div className={styles.controls}>
            {activeDirections.map((dir) => (
              <button
                key={dir}
                className={styles.ctrlBtn}
                onPointerDown={() => pressZone(dir)}
              >
                <span>{DIR_LABELS[dir].icon}</span>
                <span className={styles.ctrlKey}>[{DIR_LABELS[dir].key}]</span>
              </button>
            ))}
          </div>
        )}

        {/* Pause overlay */}
        {showPause && (
          <div className={styles.overlay}>
            <div className={styles.overlayTitle}>Paused</div>
            <div className={styles.overlayScore}>Score: {score}</div>
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
            <div className={styles.levelBadge}>Level {levelNumber} complete</div>
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
            <div className={styles.overlayScore}>Score: {score}</div>
            <div className={styles.overlaySubtext}>Keep trying!</div>
            <button className={`${styles.overlayBtn} ${styles.btnRed}`} onClick={handlePlayAgain}>
              ↺ Try Again
            </button>
            <button className={`${styles.overlayBtn} ${styles.btnGray}`} onClick={handleBack}>
              ← Back to Menu
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CatchingFromAllSidesScreen;
