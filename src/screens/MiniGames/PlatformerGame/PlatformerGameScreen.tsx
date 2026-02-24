import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMiniGameStore } from '../../../stores/miniGameStore';
import { useGameStore } from '../../../stores/gameStore';
import { audioService, AUDIO } from '../../../services/audioService';
import { PLATFORMER_LEVELS } from '../../../constants/miniGames';
import styles from './PlatformerGameScreen.module.css';

// ─── Canvas ────────────────────────────────────────────────────────────────────
const CW = 390;
const CH = 500;

// ─── Physics ───────────────────────────────────────────────────────────────────
const GRAVITY       = 900;   // px/s²
const JUMP_VEL      = -420;  // px/s
const MOVE_SPEED    = 190;   // px/s
const MAX_JUMPS     = 2;

// ─── Hero dimensions ───────────────────────────────────────────────────────────
const HERO_W = 32;
const HERO_H = 40;

// ─── Interfaces ────────────────────────────────────────────────────────────────
interface Rect   { x: number; y: number; w: number; h: number }
interface Coin   { x: number; y: number; r: number; collected: boolean; id: number }
interface Enemy  { x: number; y: number; w: number; h: number; vx: number; pl: number; pr: number; id: number }
interface Flag   { x: number; y: number; w: number; h: number }
interface Spike  extends Rect { id: number }
interface Spring extends Rect { id: number }

interface LevelData {
  platforms: Rect[];
  coins:     Coin[];
  enemies:   Enemy[];
  spikes:    Spike[];
  springs:   Spring[];
  flag:      Flag;
  startX:    number;
  startY:    number;
  worldW:    number;
}

// ─── Level builder ─────────────────────────────────────────────────────────────
// Helper: full ground strip
const ground = (x: number, y: number, w: number): Rect => ({ x, y, w, h: 20 });
const plat   = (x: number, y: number, w: number): Rect => ({ x, y, w, h: 16 });
const coin   = (id: number, x: number, y: number): Coin => ({ id, x, y, r: 10, collected: false });
const enemy  = (id: number, x: number, y: number, pl: number, pr: number): Enemy =>
  ({ id, x, y, w: 30, h: 30, vx: 60, pl, pr });
const spike  = (id: number, x: number, y: number, w = 20): Spike =>
  ({ id, x, y, w, h: 14 });
const spring = (id: number, x: number, y: number): Spring =>
  ({ id, x, y, w: 28, h: 14 });

function buildLevel(n: number): LevelData {
  switch (n) {
    case 1: return buildLevel1();
    case 2: return buildLevel2();
    case 3: return buildLevel3();
    case 4: return buildLevel4();
    case 5: return buildLevel5();
    default: return buildLevel1();
  }
}

function buildLevel1(): LevelData {
  const worldW = 1400;
  return {
    worldW,
    startX: 60, startY: 380,
    platforms: [
      ground(0,   420, worldW),
      plat(180,  340,  100),
      plat(350,  280,  120),
      plat(540,  320,  100),
      plat(720,  260,  130),
      plat(930,  320,  100),
      plat(1100, 280,  120),
      plat(1250, 340,  100),
    ],
    coins: [
      coin(0,  220, 320), coin(1, 260, 320), coin(2, 390, 260),
      coin(3,  580, 300), coin(4, 760, 240), coin(5, 800, 240),
      coin(6,  970, 300), coin(7, 1140, 260), coin(8, 1290, 320),
    ],
    enemies: [
      enemy(0, 540, 390, 400, 700),
      enemy(1, 900, 390, 800, 1100),
    ],
    spikes: [
      spike(0, 470, 406, 30),
      spike(1, 850, 406, 30),
    ],
    springs: [spring(0, 340, 406)],
    flag: { x: 1320, y: 340, w: 20, h: 80 },
  };
}

function buildLevel2(): LevelData {
  const worldW = 1800;
  return {
    worldW,
    startX: 60, startY: 380,
    platforms: [
      ground(0,   420, 300),
      plat(360,  360,  90),
      plat(520,  300,  80),
      plat(670,  340,  80),
      ground(820, 420, 200),
      plat(1090, 350,  90),
      plat(1250, 290,  80),
      plat(1390, 340,  100),
      ground(1550, 420, 250),
    ],
    coins: [
      coin(0, 380,340), coin(1,420,340), coin(2,540,280),
      coin(3,700,320), coin(4,860,400), coin(5,900,400),
      coin(6,1120,330), coin(7,1270,270), coin(8,1430,320),
      coin(9,1600,400), coin(10,1640,400),
    ],
    enemies: [
      enemy(0, 880, 390, 820, 1020),
      enemy(1, 1580, 390, 1550, 1800),
    ],
    spikes: [
      spike(0,  310, 406, 40),
      spike(1,  760, 406, 40),
      spike(2, 1480, 406, 30),
    ],
    springs: [spring(0,200,406), spring(1,1000,406)],
    flag: { x: 1740, y: 340, w: 20, h: 80 },
  };
}

function buildLevel3(): LevelData {
  const worldW = 2200;
  return {
    worldW,
    startX: 60, startY: 380,
    platforms: [
      ground(0, 420, 200),
      plat(250, 360, 70), plat(390, 300, 70), plat(520, 240, 70),
      ground(650, 420, 150),
      plat(870, 360, 70), plat(1000, 300, 70), plat(1130, 240, 70),
      ground(1280, 420, 150),
      plat(1480, 360, 80), plat(1630, 300, 80), plat(1780, 240, 80),
      ground(1950, 420, 250),
    ],
    coins: [
      coin(0,270,340), coin(1,410,280), coin(2,540,220),
      coin(3,680,400), coin(4,720,400), coin(5,890,340),
      coin(6,1020,280), coin(7,1150,220), coin(8,1310,400),
      coin(9,1500,340), coin(10,1650,280), coin(11,1800,220),
      coin(12,1980,400), coin(13,2020,400),
    ],
    enemies: [
      enemy(0, 660, 390, 650, 800),
      enemy(1, 1290, 390, 1280, 1430),
      enemy(2, 1960, 390, 1950, 2200),
    ],
    spikes: [
      spike(0, 190, 406, 40), spike(1, 790, 406, 40),
      spike(2, 1410, 406, 40), spike(3, 1870, 406, 40),
    ],
    springs: [spring(0, 100, 406), spring(1, 1350, 406)],
    flag: { x: 2130, y: 340, w: 20, h: 80 },
  };
}

function buildLevel4(): LevelData {
  const worldW = 2800;
  return {
    worldW,
    startX: 60, startY: 380,
    platforms: [
      ground(0, 420, 150),
      plat(210, 340, 60), plat(340, 280, 60), plat(470, 220, 60), plat(600, 280, 60),
      ground(720, 420, 100),
      plat(890, 340, 60), plat(1020, 260, 60), plat(1150, 320, 60),
      ground(1300, 420, 100),
      plat(1460, 350, 60), plat(1580, 280, 60), plat(1700, 210, 60),
      ground(1860, 420, 100),
      plat(2020, 340, 60), plat(2150, 270, 60), plat(2280, 200, 70),
      ground(2450, 420, 350),
    ],
    coins: [
      coin(0,220,320), coin(1,350,260), coin(2,480,200), coin(3,620,260),
      coin(4,740,400), coin(5,910,320), coin(6,1040,240), coin(7,1170,300),
      coin(8,1330,400), coin(9,1480,330), coin(10,1600,260), coin(11,1720,190),
      coin(12,1890,400), coin(13,2040,320), coin(14,2170,250), coin(15,2300,180),
      coin(16,2480,400), coin(17,2530,400),
    ],
    enemies: [
      enemy(0,730,390,720,820), enemy(1,1310,390,1300,1400),
      enemy(2,1870,390,1860,1960), enemy(3,2460,390,2450,2800),
    ],
    spikes: [
      spike(0,150,406,40), spike(1,650,406,40), spike(2,840,406,30),
      spike(3,1400,406,40), spike(4,1960,406,40),
    ],
    springs: [spring(0,800,406), spring(1,1380,406), spring(2,2000,406)],
    flag: { x: 2740, y: 340, w: 20, h: 80 },
  };
}

function buildLevel5(): LevelData {
  const worldW = 3400;
  return {
    worldW,
    startX: 60, startY: 380,
    platforms: [
      ground(0, 420, 120),
      plat(180,360,55), plat(300,300,55), plat(420,240,55), plat(540,180,55), plat(660,240,55), plat(780,300,55),
      ground(900, 420, 80),
      plat(1040,360,55), plat(1160,290,55), plat(1280,220,55), plat(1400,290,55),
      ground(1550, 420, 80),
      plat(1700,350,55), plat(1820,270,55), plat(1940,200,55), plat(2060,270,55), plat(2180,350,55),
      ground(2330, 420, 80),
      plat(2470,360,60), plat(2600,290,60), plat(2730,220,60), plat(2860,290,60),
      ground(3020, 420, 380),
    ],
    coins: [
      coin(0,200,340), coin(1,320,280), coin(2,440,220), coin(3,560,160), coin(4,680,220), coin(5,800,280),
      coin(6,940,400), coin(7,1060,340), coin(8,1180,270), coin(9,1300,200), coin(10,1420,270),
      coin(11,1580,400), coin(12,1720,330), coin(13,1840,250), coin(14,1960,180), coin(15,2080,250),
      coin(16,2360,400), coin(17,2490,340), coin(18,2620,270), coin(19,2750,200), coin(20,2880,270),
      coin(21,3050,400), coin(22,3100,400),
    ],
    enemies: [
      enemy(0,910,390,900,980), enemy(1,1560,390,1550,1630),
      enemy(2,2340,390,2330,2410), enemy(3,3030,390,3020,3400),
      enemy(4,3080,390,3020,3400),
    ],
    spikes: [
      spike(0,120,406,40), spike(1,850,406,40), spike(2,990,406,30),
      spike(3,1500,406,40), spike(4,1650,406,30),
      spike(5,2280,406,40), spike(6,2960,406,40),
    ],
    springs: [
      spring(0,80,406), spring(1,920,406), spring(2,1560,406), spring(3,2340,406),
    ],
    flag: { x: 3340, y: 340, w: 20, h: 80 },
  };
}

// ─── AABB collision ────────────────────────────────────────────────────────────
function rectsOverlap(ax:number,ay:number,aw:number,ah:number, bx:number,by:number,bw:number,bh:number) {
  return ax < bx+bw && ax+aw > bx && ay < by+bh && ay+ah > by;
}

// ─── Component ────────────────────────────────────────────────────────────────
const PlatformerGameScreen: React.FC = () => {
  const navigate = useNavigate();
  const { level: levelParam } = useParams<{ level: string }>();
  const levelNumber = parseInt(levelParam ?? '1', 10);
  const levelCfg = PLATFORMER_LEVELS.find((l) => l.number === levelNumber) ?? PLATFORMER_LEVELS[0];

  // ── Store ──
  const phase       = useMiniGameStore((s) => s.phase);
  const score       = useMiniGameStore((s) => s.score);
  const heroHealth  = useMiniGameStore((s) => s.heroHealth);
  const startGame   = useMiniGameStore((s) => s.startGame);
  const pauseGame   = useMiniGameStore((s) => s.pauseGame);
  const resumeGame  = useMiniGameStore((s) => s.resumeGame);
  const exitGame    = useMiniGameStore((s) => s.exitGame);

  // ── Canvas ──
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const rafRef       = useRef<number>(0);
  const lastTimeRef  = useRef<number>(0);
  const phaseRef     = useRef<string>('idle');
  const finishedRef  = useRef<boolean>(false);

  // ── World state (all refs for game loop) ──
  const levelRef     = useRef<LevelData>(buildLevel(levelNumber));
  const heroXRef     = useRef<number>(0);
  const heroYRef     = useRef<number>(0);
  const velXRef      = useRef<number>(0);
  const velYRef      = useRef<number>(0);
  const jumpsRef     = useRef<number>(MAX_JUMPS);
  const groundedRef  = useRef<boolean>(false);
  const cameraXRef   = useRef<number>(0);
  const coinsRef     = useRef<Coin[]>([]);
  const enemiesRef   = useRef<Enemy[]>([]);
  const spikesRef    = useRef<Spike[]>([]);
  const springsRef   = useRef<Spring[]>([]);
  const invincibleRef= useRef<number>(0); // invincibility frames timer (s)
  const walkSoundRef = useRef<number>(0);
  const dirRef       = useRef<number>(0);     // -1, 0, 1
  const jumpPressRef = useRef<boolean>(false); // true while button held

  // UI state
  const [leftActive,  setLeftActive]  = useState(false);
  const [rightActive, setRightActive] = useState(false);
  const [jumpActive,  setJumpActive]  = useState(false);

  // ── Init / reset world ──
  const resetWorld = useCallback(() => {
    const lvl = buildLevel(levelNumber);
    levelRef.current = lvl;
    heroXRef.current = lvl.startX;
    heroYRef.current = lvl.startY;
    velXRef.current  = 0;
    velYRef.current  = 0;
    jumpsRef.current = MAX_JUMPS;
    groundedRef.current = false;
    cameraXRef.current  = 0;
    coinsRef.current    = lvl.coins.map(c => ({ ...c }));
    enemiesRef.current  = lvl.enemies.map(e => ({ ...e }));
    spikesRef.current   = lvl.spikes.map(s => ({ ...s }));
    springsRef.current  = lvl.springs.map(s => ({ ...s }));
    invincibleRef.current = 0;
    finishedRef.current = false;
  }, [levelNumber]);

  // ── Mount ──
  useEffect(() => {
    resetWorld();
    startGame('Platformer', levelNumber, 3);
    audioService.playBGM(AUDIO.bgmDungeon);
    return () => { audioService.stopBGM(); cancelAnimationFrame(rafRef.current); };
  }, []); // eslint-disable-line

  // ── Sync phaseRef ──
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // ── Jump function ──
  const doJump = useCallback(() => {
    if (jumpsRef.current > 0) {
      velYRef.current = JUMP_VEL;
      jumpsRef.current--;
      audioService.playSFX(AUDIO.heroJump);
      groundedRef.current = false;
    }
  }, []);

  // ── Keyboard ──
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft'  || e.key === 'a') { dirRef.current = -1; setLeftActive(true); }
      if (e.key === 'ArrowRight' || e.key === 'd') { dirRef.current =  1; setRightActive(true); }
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
        if (!jumpPressRef.current) { jumpPressRef.current = true; doJump(); }
      }
      if (e.key === 'Escape') {
        if (phaseRef.current === 'playing') pauseGame();
        else if (phaseRef.current === 'paused') resumeGame();
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if ((e.key === 'ArrowLeft'  || e.key === 'a') && dirRef.current === -1) { dirRef.current = 0; setLeftActive(false); }
      if ((e.key === 'ArrowRight' || e.key === 'd') && dirRef.current ===  1) { dirRef.current = 0; setRightActive(false); }
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') { jumpPressRef.current = false; }
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup',   onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, [doJump, pauseGame, resumeGame]);

  // ── Game tick ──
  const tick = useCallback((timestamp: number) => {
    rafRef.current = requestAnimationFrame(tick);
    if (phaseRef.current !== 'playing') { lastTimeRef.current = timestamp; return; }
    const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = timestamp;
    if (finishedRef.current) return;

    const store = useMiniGameStore.getState();
    const lvl   = levelRef.current;

    // ── Hero movement ──
    velXRef.current = dirRef.current * MOVE_SPEED;
    velYRef.current += GRAVITY * dt;

    let nx = heroXRef.current + velXRef.current * dt;
    let ny = heroYRef.current + velYRef.current * dt;

    // Clamp horizontal within world
    nx = Math.max(0, Math.min(lvl.worldW - HERO_W, nx));

    // ── Platform collisions ──
    groundedRef.current = false;
    for (const plat of lvl.platforms) {
      // Only resolve vertical collision (hero falling onto platform)
      if (velYRef.current >= 0 &&
          heroXRef.current + HERO_W > plat.x && heroXRef.current < plat.x + plat.w &&
          ny + HERO_H >= plat.y && heroYRef.current + HERO_H <= plat.y + plat.h + 2) {
        ny = plat.y - HERO_H;
        velYRef.current = 0;
        groundedRef.current = true;
        jumpsRef.current = MAX_JUMPS;
      }
    }

    heroXRef.current = nx;
    heroYRef.current = ny;

    // ── Walk sound ──
    if (dirRef.current !== 0 && groundedRef.current) {
      walkSoundRef.current -= dt;
      if (walkSoundRef.current <= 0) {
        audioService.playSFX(AUDIO.heroWalk, 0.3);
        walkSoundRef.current = 0.35;
      }
    } else {
      walkSoundRef.current = 0;
    }

    // ── Invincibility countdown ──
    if (invincibleRef.current > 0) invincibleRef.current -= dt;

    // ── Coins ──
    for (const c of coinsRef.current) {
      if (c.collected) continue;
      if (rectsOverlap(heroXRef.current, heroYRef.current, HERO_W, HERO_H, c.x - c.r, c.y - c.r, c.r * 2, c.r * 2)) {
        c.collected = true;
        store.addScore(1);
        audioService.playSFX(AUDIO.coinPickup);
      }
    }

    // ── Spikes ──
    if (invincibleRef.current <= 0) {
      for (const s of spikesRef.current) {
        if (rectsOverlap(heroXRef.current + 4, heroYRef.current + 4, HERO_W - 8, HERO_H - 8, s.x, s.y, s.w, s.h)) {
          audioService.playSFX(AUDIO.heroHurt);
          store.damageHero();
          invincibleRef.current = 1.5;
          if (useMiniGameStore.getState().heroHealth <= 0) {
            finishedRef.current = true;
            audioService.playSFX(AUDIO.levelFailed);
            return;
          }
          break;
        }
      }
    }

    // ── Springs ──
    for (const sp of springsRef.current) {
      if (velYRef.current >= 0 &&
          heroXRef.current + HERO_W > sp.x && heroXRef.current < sp.x + sp.w &&
          heroYRef.current + HERO_H >= sp.y && heroYRef.current + HERO_H <= sp.y + sp.h + 8) {
        velYRef.current = JUMP_VEL * 1.6;
        jumpsRef.current = MAX_JUMPS;
        audioService.playSFX(AUDIO.springTrampoline);
      }
    }

    // ── Enemies ──
    if (invincibleRef.current <= 0) {
      for (const en of enemiesRef.current) {
        // Move enemy
        en.x += en.vx * dt;
        if (en.x <= en.pl) { en.x = en.pl; en.vx = Math.abs(en.vx); }
        if (en.x + en.w >= en.pr) { en.x = en.pr - en.w; en.vx = -Math.abs(en.vx); }

        // Check hero-enemy collision – stomp from above kills enemy
        if (rectsOverlap(heroXRef.current + 4, heroYRef.current, HERO_W - 8, HERO_H, en.x, en.y, en.w, en.h)) {
          const heroBottom = heroYRef.current + HERO_H;
          const enTop      = en.y;
          if (velYRef.current > 0 && heroBottom < enTop + 12) {
            // Stomp
            en.vx = 0; en.w = 0; en.h = 0; // "kill" enemy (set size 0)
            velYRef.current = JUMP_VEL * 0.6;
            store.addScore(2);
            audioService.playSFX(AUDIO.enemyHurt);
          } else {
            audioService.playSFX(AUDIO.heroHurt);
            store.damageHero();
            invincibleRef.current = 1.5;
            if (useMiniGameStore.getState().heroHealth <= 0) {
              finishedRef.current = true;
              audioService.playSFX(AUDIO.levelFailed);
              return;
            }
          }
        }
      }
    }

    // ── Camera follow ──
    cameraXRef.current = Math.max(0, Math.min(lvl.worldW - CW, heroXRef.current - CW * 0.35));

    // ── Fall off screen ──
    if (heroYRef.current > CH + 80) {
      finishedRef.current = true;
      audioService.playSFX(AUDIO.levelFailed);
      store.failLevel();
      return;
    }

    // ── Reach flag ──
    const flag = lvl.flag;
    if (rectsOverlap(heroXRef.current, heroYRef.current, HERO_W, HERO_H, flag.x, flag.y, flag.w, flag.h)) {
      finishedRef.current = true;
      audioService.playSFX(AUDIO.levelCompleted);
      useGameStore.getState().addMoney(store.score);
      store.completeLevel();
      return;
    }

    // ── Draw ──
    renderFrame(store.score, store.heroHealth);
  }, []); // eslint-disable-line

  // ── Canvas rendering ──
  const renderFrame = useCallback((currentScore: number, currentHP: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const camX = cameraXRef.current;
    const lvl  = levelRef.current;

    // Clear
    ctx.clearRect(0, 0, CW, CH);

    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, CH);
    sky.addColorStop(0, '#4a90d9');
    sky.addColorStop(1, '#87ceeb');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, CW, CH);

    // Background clouds (parallax 0.3x)
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    const cloudX = -camX * 0.3;
    const clouds = [[60,80,80,28],[200,50,100,30],[380,90,70,22],[550,60,90,26],[720,80,80,24]];
    for (const [cx,cy,cw,ch] of clouds) {
      const rx = ((cloudX + cx) % (CW + 160)) - 80;
      ctx.beginPath();
      ctx.ellipse(rx, cy, cw/2, ch/2, 0, 0, Math.PI*2);
      ctx.fill();
    }

    ctx.save();
    ctx.translate(-camX, 0);

    // ── Platforms ──
    for (const p of lvl.platforms) {
      // Top face (grass)
      ctx.fillStyle = '#5a8f3c';
      ctx.fillRect(p.x, p.y, p.w, 6);
      // Body (dirt)
      ctx.fillStyle = '#8B6914';
      ctx.fillRect(p.x, p.y + 6, p.w, p.h - 6);
      // Edge highlights
      ctx.fillStyle = '#6fb843';
      ctx.fillRect(p.x, p.y, p.w, 2);
    }

    // ── Springs ──
    for (const sp of springsRef.current) {
      ctx.fillStyle = '#e8c02a';
      ctx.fillRect(sp.x, sp.y, sp.w, sp.h);
      ctx.fillStyle = '#f5d640';
      ctx.fillRect(sp.x + 2, sp.y + 2, sp.w - 4, 4);
      // Spring coil lines
      ctx.strokeStyle = '#b8920a';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const sx = sp.x + 4 + i * ((sp.w - 8) / 3);
        ctx.beginPath();
        ctx.moveTo(sx, sp.y + 4);
        ctx.lineTo(sx, sp.y + sp.h);
        ctx.stroke();
      }
    }

    // ── Spikes ──
    for (const s of spikesRef.current) {
      ctx.fillStyle = '#cc3333';
      const count = Math.floor(s.w / 14);
      for (let i = 0; i < count; i++) {
        const sx = s.x + i * 14;
        ctx.beginPath();
        ctx.moveTo(sx + 7, s.y);
        ctx.lineTo(sx,     s.y + s.h);
        ctx.lineTo(sx + 14, s.y + s.h);
        ctx.closePath();
        ctx.fill();
      }
    }

    // ── Coins ──
    for (const c of coinsRef.current) {
      if (c.collected) continue;
      // Spin effect
      const t = Date.now() / 400;
      const scaleX = Math.abs(Math.cos(t + c.id));
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.scale(scaleX, 1);
      const cg = ctx.createRadialGradient(-3,-3,2,0,0,c.r);
      cg.addColorStop(0,'#ffe066'); cg.addColorStop(1,'#c8860a');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(0, 0, c.r, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle='#ffd700'; ctx.lineWidth=1.2; ctx.stroke();
      ctx.fillStyle='#7a4800';
      ctx.font='bold 9px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('$',0,1);
      ctx.restore();
    }

    // ── Enemies ──
    for (const en of enemiesRef.current) {
      if (en.w === 0) continue; // dead
      // Slime / blob enemy
      ctx.save();
      ctx.fillStyle = '#e05c00';
      ctx.beginPath();
      ctx.ellipse(en.x + en.w/2, en.y + en.h*0.6, en.w/2, en.h*0.6, 0, 0, Math.PI*2);
      ctx.fill();
      // Eyes
      const eyeDir = en.vx >= 0 ? 1 : -1;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(en.x + en.w/2 + eyeDir*7, en.y + en.h*0.35, 5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(en.x + en.w/2 + eyeDir*7, en.y + en.h*0.35, 5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#222';
      ctx.beginPath(); ctx.arc(en.x + en.w/2 + eyeDir*8, en.y + en.h*0.35, 2.5, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }

    // ── Flag ──
    const flag = lvl.flag;
    // Pole
    ctx.fillStyle = '#888';
    ctx.fillRect(flag.x + 9, flag.y, 4, flag.h);
    // Flag pennant
    ctx.fillStyle = '#22cc44';
    ctx.beginPath();
    ctx.moveTo(flag.x + 13, flag.y);
    ctx.lineTo(flag.x + 13 + 22, flag.y + 12);
    ctx.lineTo(flag.x + 13, flag.y + 24);
    ctx.closePath();
    ctx.fill();
    // Base
    ctx.fillStyle = '#555';
    ctx.fillRect(flag.x, flag.y + flag.h - 8, 22, 8);

    // ── Hero ──
    const hx = heroXRef.current;
    const hy = heroYRef.current;
    const isMoving = dirRef.current !== 0;
    const facingRight = dirRef.current >= 0;

    ctx.save();
    // Invincible flicker
    if (invincibleRef.current > 0 && Math.floor(invincibleRef.current * 8) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }
    ctx.translate(hx + HERO_W / 2, hy + HERO_H / 2);
    if (!facingRight) ctx.scale(-1, 1);
    ctx.translate(-(HERO_W / 2), -(HERO_H / 2));

    // Legs (animated)
    const legOff = isMoving && groundedRef.current ? Math.sin(Date.now() / 120) * 5 : 0;
    ctx.fillStyle = '#5a3010';
    ctx.fillRect(4,  HERO_H - 14 + legOff,  10, 14);
    ctx.fillRect(HERO_W - 14, HERO_H - 14 - legOff, 10, 14);

    // Body
    ctx.fillStyle = '#8B5E3C';
    ctx.beginPath();
    ctx.roundRect(2, HERO_H * 0.35, HERO_W - 4, HERO_H * 0.55, 6);
    ctx.fill();

    // Head
    ctx.fillStyle = '#a0714f';
    ctx.beginPath();
    ctx.arc(HERO_W / 2, HERO_H * 0.28, 16, 0, Math.PI * 2);
    ctx.fill();

    // Ears
    ctx.fillStyle = '#8B5E3C';
    ctx.beginPath(); ctx.arc(8,  HERO_H * 0.12, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(HERO_W - 8, HERO_H * 0.12, 7, 0, Math.PI * 2); ctx.fill();

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(HERO_W * 0.38, HERO_H * 0.24, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(HERO_W * 0.40, HERO_H * 0.24, 2.2, 0, Math.PI * 2); ctx.fill();

    // Nose
    ctx.fillStyle = '#4a2a0a';
    ctx.beginPath(); ctx.ellipse(HERO_W / 2, HERO_H * 0.32, 4, 2.5, 0, 0, Math.PI * 2); ctx.fill();

    ctx.restore();

    ctx.restore(); // end camera translate

    // ── In-canvas HUD ──
    // Timer removed for platformer (room-based, no time limit)
    // Coin count (top center)
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`Coins: ${currentScore}`, CW / 2, 6);

    // Health (top left)
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'left';
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = i < currentHP ? 1 : 0.22;
      ctx.fillText('❤️', 8 + i * 24, 6);
    }
    ctx.globalAlpha = 1;

    // Level badge (top right)
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.roundRect(CW - 78, 4, 70, 24, 6);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Lv ${levelNumber}`, CW - 10, 8);

  }, [levelNumber]);

  // ── Start RAF ──
  useEffect(() => {
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);

  // ── Overlay actions ──
  const handleBack = () => { exitGame(); navigate('/mini-games'); };

  const handlePlayAgain = () => {
    resetWorld();
    startGame('Platformer', levelNumber, 3);
  };

  const handleResume = () => resumeGame();

  // ── Mobile touch: left half = move left, right half = move right ──
  const handleCanvasTouch = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    // Tapping canvas does nothing extra (use buttons below)
  }, []);

  const showPause    = phase === 'paused';
  const showComplete = phase === 'completed';
  const showFailed   = phase === 'failed';

  return (
    <div className={styles.root}>
      {/* HUD bar */}
      <div className={styles.hud}>
        <div className={styles.hudLeft}>
          <span className={styles.hudCoins}>Coins: {score}</span>
          <div className={styles.hearts}>
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={styles.heart} style={{ opacity: i < heroHealth ? 1 : 0.22 }}>❤️</span>
            ))}
          </div>
        </div>
        <span className={styles.hudText}>Level {levelNumber}</span>
        {phase === 'playing' && (
          <button className={styles.pauseBtn} onClick={pauseGame}>⏸</button>
        )}
      </div>

      {/* Canvas */}
      <div className={styles.container}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          width={CW}
          height={CH}
          onTouchStart={handleCanvasTouch}
        />

        {/* Pause overlay */}
        {showPause && (
          <div className={styles.overlay}>
            <div className={styles.overlayTitle}>Paused</div>
            <div className={styles.overlayScore}>Coins: {score}</div>
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
            <div className={styles.levelBadge}>Level {levelNumber} cleared</div>
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
            <div className={styles.overlayScore}>Coins: {score}</div>
            <div className={styles.overlaySubtext}>Keep going!</div>
            <button className={`${styles.overlayBtn} ${styles.btnRed}`} onClick={handlePlayAgain}>
              ↺ Try Again
            </button>
            <button className={`${styles.overlayBtn} ${styles.btnGray}`} onClick={handleBack}>
              ← Back to Menu
            </button>
          </div>
        )}
      </div>

      {/* On-screen controls */}
      <div className={styles.controls}>
        <div className={styles.ctrlRow}>
          <button
            className={`${styles.ctrlBtn} ${leftActive ? styles.ctrlBtnActive : ''}`}
            onPointerDown={() => { dirRef.current = -1; setLeftActive(true); }}
            onPointerUp={() => { if (dirRef.current === -1) dirRef.current = 0; setLeftActive(false); }}
            onPointerLeave={() => { if (dirRef.current === -1) dirRef.current = 0; setLeftActive(false); }}
          >◀</button>
          <button
            className={`${styles.ctrlBtn} ${rightActive ? styles.ctrlBtnActive : ''}`}
            onPointerDown={() => { dirRef.current = 1; setRightActive(true); }}
            onPointerUp={() => { if (dirRef.current === 1) dirRef.current = 0; setRightActive(false); }}
            onPointerLeave={() => { if (dirRef.current === 1) dirRef.current = 0; setRightActive(false); }}
          >▶</button>
        </div>
        <button
          className={`${styles.jumpBtn} ${jumpActive ? styles.jumpBtnActive : ''}`}
          onPointerDown={() => { setJumpActive(true); doJump(); }}
          onPointerUp={() => setJumpActive(false)}
          onPointerLeave={() => setJumpActive(false)}
        >
          ↑ JUMP
        </button>
      </div>
    </div>
  );
};

export default PlatformerGameScreen;
