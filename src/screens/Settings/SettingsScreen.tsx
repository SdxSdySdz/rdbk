import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../../stores/settingsStore';
import { useLocalization } from '../../hooks/useLocalization';
import styles from './SettingsScreen.module.css';

const SettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const t = useLocalization();

  const language = useSettingsStore((s) => s.language);
  const musicVolume = useSettingsStore((s) => s.musicVolume);
  const soundVolume = useSettingsStore((s) => s.soundVolume);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const setMusicVolume = useSettingsStore((s) => s.setMusicVolume);
  const setSoundVolume = useSettingsStore((s) => s.setSoundVolume);

  const [engFlagErr, setEngFlagErr] = useState(false);
  const [ruFlagErr, setRuFlagErr] = useState(false);

  return (
    <div className={styles.root}>
      <div className={styles.layout}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/')}>
            ← Home
          </button>
          <h1 className={styles.title}>{t('settings') || 'Settings'}</h1>
        </div>

        {/* Language */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Language</h2>
          <div className={styles.langRow}>
            <button
              className={`${styles.langBtn} ${language === 'en' ? styles.langBtnActive : ''}`}
              onClick={() => setLanguage('en')}
              aria-label="English"
            >
              {!engFlagErr ? (
                <img
                  src="/assets/sprites/UI/Settings/eng.png"
                  alt="EN"
                  className={styles.flagImg}
                  onError={() => setEngFlagErr(true)}
                />
              ) : (
                <span className={styles.flagEmoji}>🇺🇸</span>
              )}
              <span className={styles.langLabel}>English</span>
            </button>

            <button
              className={`${styles.langBtn} ${language === 'ru' ? styles.langBtnActive : ''}`}
              onClick={() => setLanguage('ru')}
              aria-label="Russian"
            >
              {!ruFlagErr ? (
                <img
                  src="/assets/sprites/UI/Settings/rus.png"
                  alt="RU"
                  className={styles.flagImg}
                  onError={() => setRuFlagErr(true)}
                />
              ) : (
                <span className={styles.flagEmoji}>🇷🇺</span>
              )}
              <span className={styles.langLabel}>Русский</span>
            </button>
          </div>
        </div>

        {/* Audio */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Audio</h2>

          <div className={styles.sliderGroup}>
            <div className={styles.sliderHeader}>
              <span className={styles.sliderLabel}>🎵 Music</span>
              <span className={styles.sliderValue}>{Math.round(musicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={musicVolume}
              onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
              className={styles.slider}
            />
          </div>

          <div className={styles.sliderGroup}>
            <div className={styles.sliderHeader}>
              <span className={styles.sliderLabel}>🔊 Sounds</span>
              <span className={styles.sliderValue}>{Math.round(soundVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={soundVolume}
              onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
              className={styles.slider}
            />
          </div>
        </div>

        {/* Social links */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Social</h2>
          <div className={styles.socialRow}>
            <a
              href="https://t.me/qwrdx"
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.socialBtn} ${styles.btnTelegram}`}
            >
              ✈️ Telegram
            </a>
            <a
              href="https://twitter.com/qwrdx"
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.socialBtn} ${styles.btnTwitter}`}
            >
              🐦 Twitter
            </a>
          </div>
        </div>

        {/* App info */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>About</h2>
          <p className={styles.aboutText}>Qwrdx Pet Simulation v1.0</p>
          <p className={styles.aboutText}>Raise your virtual pet, play mini-games, and build a career!</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
