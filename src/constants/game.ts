export const MAX_HEALTH_POINTS = 8;
export const PET_COUNT = 4;
export const STAT_COUNT = 6;

export const DECREASE_INTERVAL_HOURS = 4;
export const HEALTH_CHANGE_INTERVAL_HOURS = 8;
export const DECREASE_RATE_EARLY = 0.2; // first 12h
export const DECREASE_RATE_NORMAL = 0.15; // after 12h

export const SPECIAL_CODES = [
  '24DZMXNW',
  '0VUMFF2B',
  'G6JIPFDJ',
  '63VYIFPY',
  '5DAQWCCM',
  'OGM5CCKD',
  '5Q3VRX90',
];

export const REVIVE_COST = 2;

// Pet sprites base
export const PET_SPRITES: Record<string, string> = {
  bear: '/assets/sprites/DailyRoutine/Food/Bear/BearFood_1.png',
  dog: '/assets/sprites/doge.png',
  frog: '/assets/sprites/DailyRoutine/Shower/Frog/FrogShower_1.png',
  unicorn: '/assets/sprites/unicorn.png',
};

export const FOOD_ITEMS = [
  { id: 'apple', sprite: '/assets/sprites/DailyRoutine/Food/Apple.png', label: 'Apple' },
  { id: 'pizza', sprite: '/assets/sprites/DailyRoutine/Food/Pizza.png', label: 'Pizza' },
  { id: 'burger', sprite: '/assets/sprites/DailyRoutine/Food/Burger.png', label: 'Burger' },
  { id: 'milk', sprite: '/assets/sprites/DailyRoutine/Food/Milk.png', label: 'Milk' },
];
