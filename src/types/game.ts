export enum StatIndex {
  Games = 0,
  Food = 1,
  Shower = 2,
  Education = 3,
  Career = 4,
  Fun = 5,
}

export const STAT_NAMES: Record<StatIndex, string> = {
  [StatIndex.Games]: 'games',
  [StatIndex.Food]: 'food',
  [StatIndex.Shower]: 'shower',
  [StatIndex.Education]: 'education',
  [StatIndex.Career]: 'career',
  [StatIndex.Fun]: 'fun',
};

export interface PetState {
  stats: number[]; // 6 stats (0-1)
  healthPoints: number; // 0-8
  petName: string;
  firstLaunchTime: string; // ISO string
  lastDecreaseTime: string; // ISO string
  lastHealthCheckTime: string; // ISO string
}

export const PET_CHAR_IDS = ['bear', 'dog', 'frog', 'unicorn'] as const;
export type PetCharId = typeof PET_CHAR_IDS[number];

export type MiniGameType = 'Platformer' | 'CatchingFromSky' | 'CatchingFromAllSides';
export type GamePhase = 'idle' | 'playing' | 'paused' | 'completed' | 'failed';
