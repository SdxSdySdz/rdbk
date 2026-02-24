export interface CatchingFromSkyLevelConfig {
  number: number;
  moneyLimit: number;
  heroHealthCount: number;
  completionTime: number;
  spikeSpawnRate: number;
  access: 'Free' | 'CompletesPreviousLevel' | 'NeedsTwoReferrals';
}

export interface CatchingFromAllSidesLevelConfig {
  number: number;
  moneyLimit: number;
  coinChuteLevelsCount: number;
  completionTime: number;
  coinsSpawnRate: number;
  access: 'Free' | 'CompletesPreviousLevel' | 'NeedsTwoReferrals';
}

export interface PlatformerLevelConfig {
  number: number;
  moneyLimit: number;
  roomsCount: number;
  access: 'Free' | 'CompletesPreviousLevel' | 'NeedsTwoReferrals';
}

export const CATCHING_FROM_SKY_LEVELS: CatchingFromSkyLevelConfig[] = [
  { number: 1, moneyLimit: 10, heroHealthCount: 3, completionTime: 60, spikeSpawnRate: 0.5, access: 'Free' },
  { number: 2, moneyLimit: 15, heroHealthCount: 3, completionTime: 60, spikeSpawnRate: 1.0, access: 'CompletesPreviousLevel' },
  { number: 3, moneyLimit: 20, heroHealthCount: 2, completionTime: 50, spikeSpawnRate: 1.5, access: 'CompletesPreviousLevel' },
  { number: 4, moneyLimit: 25, heroHealthCount: 2, completionTime: 45, spikeSpawnRate: 2.0, access: 'NeedsTwoReferrals' },
  { number: 5, moneyLimit: 30, heroHealthCount: 1, completionTime: 40, spikeSpawnRate: 2.5, access: 'NeedsTwoReferrals' },
];

export const CATCHING_FROM_ALL_SIDES_LEVELS: CatchingFromAllSidesLevelConfig[] = [
  { number: 1, moneyLimit: 10, coinChuteLevelsCount: 1, completionTime: 60, coinsSpawnRate: 1.0, access: 'Free' },
  { number: 2, moneyLimit: 15, coinChuteLevelsCount: 1, completionTime: 60, coinsSpawnRate: 1.5, access: 'CompletesPreviousLevel' },
  { number: 3, moneyLimit: 20, coinChuteLevelsCount: 2, completionTime: 50, coinsSpawnRate: 2.0, access: 'CompletesPreviousLevel' },
  { number: 4, moneyLimit: 25, coinChuteLevelsCount: 2, completionTime: 45, coinsSpawnRate: 2.5, access: 'NeedsTwoReferrals' },
  { number: 5, moneyLimit: 30, coinChuteLevelsCount: 2, completionTime: 40, coinsSpawnRate: 3.0, access: 'NeedsTwoReferrals' },
];

export const PLATFORMER_LEVELS: PlatformerLevelConfig[] = [
  { number: 1, moneyLimit: 10, roomsCount: 3, access: 'Free' },
  { number: 2, moneyLimit: 15, roomsCount: 5, access: 'CompletesPreviousLevel' },
  { number: 3, moneyLimit: 20, roomsCount: 7, access: 'CompletesPreviousLevel' },
  { number: 4, moneyLimit: 25, roomsCount: 9, access: 'NeedsTwoReferrals' },
  { number: 5, moneyLimit: 30, roomsCount: 14, access: 'NeedsTwoReferrals' },
];
