import { create } from 'zustand';
import { prefs } from '../services/localStorage';
import type { MiniGameType, GamePhase } from '../types/game';

interface MiniGameStore {
  activeGame: MiniGameType | null;
  currentLevel: number;
  score: number;
  phase: GamePhase;
  heroHealth: number;
  tickets: number;
  completedLevels: Record<string, Set<number>>;

  startGame: (type: MiniGameType, level: number, heroHealth: number) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  addScore: (amount: number) => void;
  completeLevel: () => void;
  failLevel: () => void;
  exitGame: () => void;
  damageHero: () => void;
  getLevelCompleted: (type: MiniGameType, level: number) => boolean;
  isLevelUnlocked: (type: MiniGameType, level: number, referralCount: number) => boolean;
}

function loadCompletedLevels(): Record<string, Set<number>> {
  const result: Record<string, Set<number>> = {
    Platformer: new Set(),
    CatchingFromSky: new Set(),
    CatchingFromAllSides: new Set(),
  };
  const types: MiniGameType[] = ['Platformer', 'CatchingFromSky', 'CatchingFromAllSides'];
  types.forEach(type => {
    const data = prefs.getString(`completedLevels_${type}`, '');
    if (data) {
      data.split(',').forEach(n => {
        const num = parseInt(n);
        if (!isNaN(num)) result[type].add(num);
      });
    }
  });
  return result;
}

function saveCompletedLevel(type: MiniGameType, level: number) {
  const data = prefs.getString(`completedLevels_${type}`, '');
  const levels = new Set(data ? data.split(',').map(Number) : []);
  levels.add(level);
  prefs.setString(`completedLevels_${type}`, Array.from(levels).join(','));
}

export const useMiniGameStore = create<MiniGameStore>((set, get) => ({
  activeGame: null,
  currentLevel: 1,
  score: 0,
  phase: 'idle',
  heroHealth: 3,
  tickets: prefs.getInt('Tickets', 5),
  completedLevels: loadCompletedLevels(),

  startGame: (type, level, heroHealth) => {
    set({ activeGame: type, currentLevel: level, score: 0, phase: 'playing', heroHealth });
  },

  pauseGame: () => set({ phase: 'paused' }),
  resumeGame: () => set({ phase: 'playing' }),

  addScore: (amount) => set(state => ({ score: state.score + amount })),

  completeLevel: () => {
    const { activeGame, currentLevel } = get();
    if (activeGame) saveCompletedLevel(activeGame, currentLevel);
    const completedLevels = loadCompletedLevels();
    set({ phase: 'completed', completedLevels });
  },

  failLevel: () => set({ phase: 'failed' }),

  exitGame: () => set({ activeGame: null, phase: 'idle', score: 0 }),

  damageHero: () => {
    set(state => {
      const heroHealth = state.heroHealth - 1;
      if (heroHealth <= 0) return { heroHealth: 0, phase: 'failed' };
      return { heroHealth };
    });
  },

  getLevelCompleted: (type, level) => {
    return get().completedLevels[type]?.has(level) ?? false;
  },

  isLevelUnlocked: (type, level, referralCount) => {
    if (level === 1) return true;
    const { getLevelCompleted } = get();
    const access = getAccess(type, level);
    if (access === 'Free') return true;
    if (access === 'CompletesPreviousLevel') return getLevelCompleted(type, level - 1);
    if (access === 'NeedsTwoReferrals') return referralCount >= 2;
    return false;
  },
}));

function getAccess(type: MiniGameType, level: number): string {
  // Simple progression: level 1-2 free, 3-4 requires previous, 5+ requires referrals
  if (level <= 1) return 'Free';
  if (level <= 3) return 'CompletesPreviousLevel';
  return 'NeedsTwoReferrals';
}
