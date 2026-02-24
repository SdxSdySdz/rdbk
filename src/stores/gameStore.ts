import { create } from 'zustand';
import { prefs } from '../services/localStorage';
import {
  MAX_HEALTH_POINTS,
  PET_COUNT,
  STAT_COUNT,
  DECREASE_INTERVAL_HOURS,
  HEALTH_CHANGE_INTERVAL_HOURS,
  DECREASE_RATE_EARLY,
  DECREASE_RATE_NORMAL,
  REVIVE_COST,
  SPECIAL_CODES,
} from '../constants/game';
import type { PetState } from '../types/game';

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function nowISO() {
  return new Date().toISOString();
}

function hoursBetween(a: string, b: string) {
  return (new Date(b).getTime() - new Date(a).getTime()) / 3600000;
}

function addHoursToISO(iso: string, hours: number) {
  return new Date(new Date(iso).getTime() + hours * 3600000).toISOString();
}

function defaultPetState(index: number): PetState {
  const now = nowISO();
  return {
    stats: Array(STAT_COUNT).fill(0.5),
    healthPoints: MAX_HEALTH_POINTS,
    petName: `Pet ${index + 1}`,
    firstLaunchTime: now,
    lastDecreaseTime: now,
    lastHealthCheckTime: now,
  };
}

function loadPetState(index: number): PetState {
  const def = defaultPetState(index);
  const stats = Array.from({ length: STAT_COUNT }, (_, j) =>
    prefs.getFloat(`Stat_${index}_${j}`, 0.5)
  );
  const now = nowISO();
  return {
    stats,
    healthPoints: prefs.getInt(`HealthPoints_${index}`, MAX_HEALTH_POINTS),
    petName: prefs.getString(`PetName_${index}`, def.petName),
    firstLaunchTime: prefs.getString(`FirstLaunchTime_${index}`, now),
    lastDecreaseTime: prefs.getString(`LastDecreaseTime_${index}`, now),
    lastHealthCheckTime: prefs.getString(`LastHealthCheckTime_${index}`, now),
  };
}

function savePetState(index: number, state: PetState) {
  state.stats.forEach((v, j) => prefs.setFloat(`Stat_${index}_${j}`, v));
  prefs.setInt(`HealthPoints_${index}`, state.healthPoints);
  prefs.setString(`PetName_${index}`, state.petName);
  prefs.setString(`FirstLaunchTime_${index}`, state.firstLaunchTime);
  prefs.setString(`LastDecreaseTime_${index}`, state.lastDecreaseTime);
  prefs.setString(`LastHealthCheckTime_${index}`, state.lastHealthCheckTime);
}

function applyDecay(pet: PetState): PetState {
  const now = nowISO();
  const hoursFromFirst = hoursBetween(pet.firstLaunchTime, now);
  const hoursSinceLast = hoursBetween(pet.lastDecreaseTime, now);

  if (hoursSinceLast < DECREASE_INTERVAL_HOURS) return pet;

  const intervals = Math.floor(hoursSinceLast / DECREASE_INTERVAL_HOURS);
  const decayAmount = hoursFromFirst < 12 ? DECREASE_RATE_EARLY : DECREASE_RATE_NORMAL;

  let newStats = [...pet.stats];
  for (let i = 0; i < intervals; i++) {
    newStats = newStats.map(s => clamp01(s - decayAmount));
  }

  const newLastDecreaseTime = addHoursToISO(
    pet.lastDecreaseTime,
    intervals * DECREASE_INTERVAL_HOURS
  );

  return { ...pet, stats: newStats, lastDecreaseTime: newLastDecreaseTime };
}

function applyHealthCheck(pet: PetState, hasSpecialCode: boolean): PetState {
  const now = nowISO();
  const hoursSinceCheck = hoursBetween(pet.lastHealthCheckTime, now);
  if (hoursSinceCheck < HEALTH_CHANGE_INTERVAL_HOURS) return pet;

  let hp = pet.healthPoints;
  const allZero = pet.stats.every(s => s < 0.01);
  const allFull = pet.stats.every(s => s > 0.99);

  if (allZero) {
    if (!(hasSpecialCode && hp <= 1)) {
      hp = Math.max(0, hp - 1);
    }
  } else if (allFull) {
    hp = Math.min(MAX_HEALTH_POINTS, hp + 1);
  }

  return { ...pet, healthPoints: hp, lastHealthCheckTime: now };
}

interface GameStore {
  pets: PetState[];
  currentPetIndex: number;
  money: number;
  hasSpecialCode: boolean;

  loadAll: () => void;
  saveAll: () => void;
  setCurrentPet: (index: number) => void;
  modifyStat: (petIndex: number, statIndex: number, delta: number) => void;
  setPetName: (petIndex: number, name: string) => void;
  addMoney: (amount: number) => void;
  revivePet: (petIndex: number) => boolean;
  reviveAllPets: () => void;
  checkAndApplyOfflineProgress: () => void;
  setHasSpecialCode: (has: boolean) => void;
  setStatDirect: (petIndex: number, statIndex: number, value: number) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  pets: Array.from({ length: PET_COUNT }, (_, i) => loadPetState(i)),
  currentPetIndex: 0,
  money: prefs.getInt('Money', 0),
  hasSpecialCode: false,

  loadAll: () => {
    const pets = Array.from({ length: PET_COUNT }, (_, i) => loadPetState(i));
    set({ pets, money: prefs.getInt('Money', 0) });
  },

  saveAll: () => {
    const { pets, money } = get();
    pets.forEach((p, i) => savePetState(i, p));
    prefs.setInt('Money', money);
  },

  setCurrentPet: (index) => set({ currentPetIndex: index }),

  modifyStat: (petIndex, statIndex, delta) => {
    set(state => {
      const pets = [...state.pets];
      const pet = { ...pets[petIndex] };
      const stats = [...pet.stats];
      stats[statIndex] = clamp01(stats[statIndex] + delta);
      pet.stats = stats;
      pets[petIndex] = pet;
      savePetState(petIndex, pet);
      return { pets };
    });
  },

  setStatDirect: (petIndex, statIndex, value) => {
    set(state => {
      const pets = [...state.pets];
      const pet = { ...pets[petIndex] };
      const stats = [...pet.stats];
      stats[statIndex] = clamp01(value);
      pet.stats = stats;
      pets[petIndex] = pet;
      savePetState(petIndex, pet);
      return { pets };
    });
  },

  setPetName: (petIndex, name) => {
    set(state => {
      const pets = [...state.pets];
      pets[petIndex] = { ...pets[petIndex], petName: name };
      savePetState(petIndex, pets[petIndex]);
      return { pets };
    });
  },

  addMoney: (amount) => {
    set(state => {
      const money = state.money + amount;
      prefs.setInt('Money', money);
      return { money };
    });
  },

  revivePet: (petIndex) => {
    const { pets, money, hasSpecialCode } = get();
    const cost = hasSpecialCode ? 0 : REVIVE_COST;
    if (pets[petIndex].healthPoints > 0) return false;
    if (!hasSpecialCode && money < cost) return false;

    set(state => {
      const newMoney = hasSpecialCode ? state.money : state.money - cost;
      const pets = [...state.pets];
      pets[petIndex] = {
        ...pets[petIndex],
        healthPoints: MAX_HEALTH_POINTS,
        stats: Array(STAT_COUNT).fill(0.5),
      };
      savePetState(petIndex, pets[petIndex]);
      prefs.setInt('Money', newMoney);
      return { pets, money: newMoney };
    });
    return true;
  },

  reviveAllPets: () => {
    set(state => {
      const pets = state.pets.map((pet, i) => {
        if (pet.healthPoints <= 0) {
          const revived = {
            ...pet,
            healthPoints: MAX_HEALTH_POINTS,
            stats: Array(STAT_COUNT).fill(0.5),
          };
          savePetState(i, revived);
          return revived;
        }
        return pet;
      });
      return { pets };
    });
  },

  checkAndApplyOfflineProgress: () => {
    const { hasSpecialCode } = get();
    set(state => {
      const pets = state.pets.map(pet => {
        let p = applyDecay(pet);
        p = applyHealthCheck(p, hasSpecialCode);
        return p;
      });
      pets.forEach((p, i) => savePetState(i, p));
      return { pets };
    });
  },

  setHasSpecialCode: (has) => {
    set({ hasSpecialCode: has });
    if (has) get().reviveAllPets();
  },
}));

// Check if referral code in storage is special
export function checkStoredReferralCode(): boolean {
  const code = prefs.getString('ReferralCode', '');
  if (!code) return false;
  return SPECIAL_CODES.some(c => c.toLowerCase() === code.toLowerCase());
}
