import { useSettingsStore } from '../stores/settingsStore';

class AudioService {
  private bgm: HTMLAudioElement | null = null;
  private currentBgmSrc = '';

  private get musicVol() {
    return useSettingsStore.getState().musicVolume;
  }
  private get sfxVol() {
    return useSettingsStore.getState().soundVolume;
  }

  playBGM(src: string, loop = true) {
    if (this.currentBgmSrc === src && this.bgm && !this.bgm.paused) return;
    this.stopBGM();
    const audio = new Audio(src);
    audio.loop = loop;
    audio.volume = this.musicVol;
    audio.play().catch(() => {});
    this.bgm = audio;
    this.currentBgmSrc = src;
  }

  stopBGM() {
    if (this.bgm) {
      this.bgm.pause();
      this.bgm.currentTime = 0;
      this.bgm = null;
      this.currentBgmSrc = '';
    }
  }

  pauseBGM() {
    this.bgm?.pause();
  }

  resumeBGM() {
    this.bgm?.play().catch(() => {});
  }

  setMusicVolume(v: number) {
    if (this.bgm) this.bgm.volume = v;
  }

  playSFX(src: string, volume?: number) {
    const audio = new Audio(src);
    audio.volume = volume ?? this.sfxVol;
    audio.play().catch(() => {});
  }
}

export const audioService = new AudioService();

export const AUDIO = {
  // Music
  bgmMain: '/assets/audio/Music/SeaTeme1.wav',
  bgmDungeon: '/assets/audio/Music/DungeonTheme1.wav',
  bgmField: '/assets/audio/Music/FieldTheme2.wav',
  bgmFood: '/assets/audio/Music/FoodTheme.mp3',
  bgmFun: '/assets/audio/Music/FunTheme.mp3',
  bgmShower: '/assets/audio/Music/ShowerTheme.mp3',
  // SFX
  buttonClick: '/assets/audio/UI/ButtonClick.wav',
  dailyInteraction: '/assets/audio/DailyRoutine/DailyRoutineInteraction.mp3',
  dailyCompletion: '/assets/audio/DailyRoutine/DailyRoutineCompletion.flac',
  bubble: '/assets/audio/DailyRoutine/Bubble.mp3',
  bubbles: '/assets/audio/DailyRoutine/Bubbles.mp3',
  starBooster: '/assets/audio/DailyRoutine/StarBooster.mp3',
  puff: '/assets/audio/DailyRoutine/Puff.mp3',
  coinPickup: '/assets/audio/MiniGames/CoinPickUp.mp3',
  coinsIncreasing: '/assets/audio/MiniGames/CoinsIncreasing.mp3',
  heroDeath: '/assets/audio/MiniGames/HeroDeath.mp3',
  heroHurt: '/assets/audio/MiniGames/HeroHurt.wav',
  heroJump: '/assets/audio/MiniGames/HeroJump.mp3',
  heroSliding: '/assets/audio/MiniGames/HeroSliding.mp3',
  heroWalk: '/assets/audio/MiniGames/HeroWalk.mp3',
  enemyHurt: '/assets/audio/MiniGames/EnemyHurt.wav',
  levelCompleted: '/assets/audio/MiniGames/LevelCompleted.mp3',
  levelFailed: '/assets/audio/MiniGames/LevelFailed.mp3',
  springTrampoline: '/assets/audio/MiniGames/SpringTrampoline.mp3',
};
