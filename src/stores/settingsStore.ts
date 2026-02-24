import { create } from 'zustand';
import { prefs } from '../services/localStorage';

interface SettingsStore {
  language: 'en' | 'ru';
  musicVolume: number;
  soundVolume: number;
  bep20Address: string;

  setLanguage: (lang: 'en' | 'ru') => void;
  setMusicVolume: (v: number) => void;
  setSoundVolume: (v: number) => void;
  setBep20Address: (addr: string) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  language: (prefs.getString('language', 'en') as 'en' | 'ru'),
  musicVolume: prefs.getFloat('audio_music_volume', 0.7),
  soundVolume: prefs.getFloat('audio_sound_volume', 0.8),
  bep20Address: prefs.getString('PlayerBEP20', ''),

  setLanguage: (lang) => {
    prefs.setString('language', lang);
    set({ language: lang });
  },
  setMusicVolume: (v) => {
    prefs.setFloat('audio_music_volume', v);
    set({ musicVolume: v });
  },
  setSoundVolume: (v) => {
    prefs.setFloat('audio_sound_volume', v);
    set({ soundVolume: v });
  },
  setBep20Address: (addr) => {
    prefs.setString('PlayerBEP20', addr);
    set({ bep20Address: addr });
  },
}));
