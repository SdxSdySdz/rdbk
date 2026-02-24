import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalization } from '../../hooks/useLocalization';
import styles from './DailyRoutineMenuScreen.module.css';

const DailyRoutineMenuScreen: React.FC = () => {
  const navigate = useNavigate();
  const t = useLocalization();
  const [bgError, setBgError] = useState(false);

  return (
    <div className={styles.root}>
      {!bgError ? (
        <img
          src="/assets/sprites/DailyRoutine/Food/FoodBg.png"
          alt=""
          className={styles.bg}
          onError={() => setBgError(true)}
        />
      ) : (
        <div className={styles.bgFallback} />
      )}

      <div className={styles.layout}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/')}>
            ← Home
          </button>
          <h1 className={styles.title}>{t('daily_routine') || 'Daily Routine'}</h1>
          <p className={styles.subtitle}>Take care of your pet every day!</p>
        </div>

        <div className={styles.buttonGrid}>
          <button
            className={`${styles.activityBtn} ${styles.foodBtn}`}
            onClick={() => navigate('/daily-routine/food')}
          >
            <span className={styles.activityIcon}>🍎</span>
            <span className={styles.activityLabel}>{t('food') || 'Food'}</span>
            <span className={styles.activityDesc}>Feed your pet</span>
          </button>

          <button
            className={`${styles.activityBtn} ${styles.showerBtn}`}
            onClick={() => navigate('/daily-routine/shower')}
          >
            <span className={styles.activityIcon}>🚿</span>
            <span className={styles.activityLabel}>{t('shower') || 'Shower'}</span>
            <span className={styles.activityDesc}>Keep it clean</span>
          </button>

          <button
            className={`${styles.activityBtn} ${styles.funBtn}`}
            onClick={() => navigate('/daily-routine/fun')}
          >
            <span className={styles.activityIcon}>🎉</span>
            <span className={styles.activityLabel}>{t('fun') || 'Fun'}</span>
            <span className={styles.activityDesc}>Play and enjoy</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyRoutineMenuScreen;
