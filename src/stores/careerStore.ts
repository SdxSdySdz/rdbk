import { create } from 'zustand';
import { prefs } from '../services/localStorage';
import { PET_CHAR_IDS } from '../types/game';

export type CareerTier =
  | 'Junior'
  | 'Handyman'
  | 'PoliceOfficer'
  | 'Nurse'
  | 'Doctor'
  | 'Manager'
  | 'President';

export const CAREER_TIERS: CareerTier[] = [
  'Junior',
  'Handyman',
  'PoliceOfficer',
  'Nurse',
  'Doctor',
  'Manager',
  'President',
];

export const PROGRESS_SPEED = 0.1; // units per second

export interface CharacterCareer {
  activeTiers: Record<CareerTier, boolean>;
  progress: Record<CareerTier, number>; // 0-100
  lastSaveTime: string;
}

function defaultCareer(): CharacterCareer {
  const activeTiers = {} as Record<CareerTier, boolean>;
  const progress = {} as Record<CareerTier, number>;
  CAREER_TIERS.forEach(t => {
    activeTiers[t] = t === 'Junior'; // Junior starts active
    progress[t] = 0;
  });
  return { activeTiers, progress, lastSaveTime: new Date().toISOString() };
}

function loadCareer(charId: string): CharacterCareer {
  const career = defaultCareer();
  CAREER_TIERS.forEach(tier => {
    career.activeTiers[tier] = prefs.getBool(`career_${charId}_is${tier}`, tier === 'Junior');
    career.progress[tier] = prefs.getFloat(`career_${charId}_${tier}Progress`, 0);
  });
  career.lastSaveTime = prefs.getString(
    `career_${charId}_lastSaveTime`,
    new Date().toISOString()
  );
  return career;
}

function saveCareer(charId: string, career: CharacterCareer) {
  CAREER_TIERS.forEach(tier => {
    prefs.setBool(`career_${charId}_is${tier}`, career.activeTiers[tier]);
    prefs.setFloat(`career_${charId}_${tier}Progress`, career.progress[tier]);
  });
  prefs.setString(`career_${charId}_lastSaveTime`, new Date().toISOString());
}

function applyOfflineProgress(career: CharacterCareer): CharacterCareer {
  const now = Date.now();
  const last = new Date(career.lastSaveTime).getTime();
  const secondsPassed = Math.max(0, (now - last) / 1000);
  const offlineProgress = secondsPassed * PROGRESS_SPEED;

  const progress = { ...career.progress };
  CAREER_TIERS.forEach(tier => {
    if (career.activeTiers[tier]) {
      progress[tier] = Math.min(100, progress[tier] + offlineProgress);
    }
  });

  return { ...career, progress, lastSaveTime: new Date().toISOString() };
}

interface CareerStore {
  careers: Record<string, CharacterCareer>;
  loadAll: () => void;
  saveAll: () => void;
  setTierActive: (charId: string, tier: CareerTier, active: boolean) => void;
  tickProgress: (charId: string, deltaSeconds: number) => void;
  applyOfflineProgress: (charId: string) => void;
  getHighestTier: (charId: string) => CareerTier | null;
}

export const useCareerStore = create<CareerStore>((set, get) => ({
  careers: Object.fromEntries(
    PET_CHAR_IDS.map(id => [id, loadCareer(id)])
  ),

  loadAll: () => {
    const careers = Object.fromEntries(
      PET_CHAR_IDS.map(id => [id, loadCareer(id)])
    );
    set({ careers });
  },

  saveAll: () => {
    const { careers } = get();
    PET_CHAR_IDS.forEach(id => saveCareer(id, careers[id]));
  },

  setTierActive: (charId, tier, active) => {
    set(state => {
      const career = { ...state.careers[charId] };
      career.activeTiers = { ...career.activeTiers, [tier]: active };
      saveCareer(charId, career);
      return { careers: { ...state.careers, [charId]: career } };
    });
  },

  tickProgress: (charId, deltaSeconds) => {
    set(state => {
      const career = state.careers[charId];
      if (!career) return state;
      const progress = { ...career.progress };
      let changed = false;
      CAREER_TIERS.forEach(tier => {
        if (career.activeTiers[tier] && progress[tier] < 100) {
          progress[tier] = Math.min(100, progress[tier] + deltaSeconds * PROGRESS_SPEED);
          changed = true;
        }
      });
      if (!changed) return state;
      const updated = { ...career, progress };
      return { careers: { ...state.careers, [charId]: updated } };
    });
  },

  applyOfflineProgress: (charId) => {
    set(state => {
      const career = state.careers[charId];
      if (!career) return state;
      const updated = applyOfflineProgress(career);
      saveCareer(charId, updated);
      return { careers: { ...state.careers, [charId]: updated } };
    });
  },

  getHighestTier: (charId) => {
    const career = get().careers[charId];
    if (!career) return null;
    for (let i = CAREER_TIERS.length - 1; i >= 0; i--) {
      if (career.activeTiers[CAREER_TIERS[i]]) return CAREER_TIERS[i];
    }
    return null;
  },
}));
