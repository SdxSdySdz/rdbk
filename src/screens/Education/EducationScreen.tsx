import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCareerStore, CAREER_TIERS } from '../../stores/careerStore';
import type { CareerTier } from '../../stores/careerStore';
import { useGameStore } from '../../stores/gameStore';
import { useLocalization } from '../../hooks/useLocalization';
import { PET_CHAR_IDS } from '../../types/game';
import ProgressBar from '../../components/ProgressBar/ProgressBar';
import styles from './EducationScreen.module.css';

const EDUCATION_STAGES = [
  { label: 'School', icon: '🏫', minTier: 'Junior' },
  { label: 'High School', icon: '📖', minTier: 'Handyman' },
  { label: 'College', icon: '🎓', minTier: 'PoliceOfficer' },
  { label: 'University', icon: '🏛️', minTier: 'Doctor' },
  { label: 'Master of Science', icon: '🔬', minTier: 'President' },
] as const;

const TIER_COLORS: Record<CareerTier, string> = {
  Junior: '#78909C',
  Handyman: '#8D6E63',
  PoliceOfficer: '#42A5F5',
  Nurse: '#EC407A',
  Doctor: '#66BB6A',
  Manager: '#AB47BC',
  President: '#FFD700',
};

const TIER_ICONS: Record<CareerTier, string> = {
  Junior: '👶',
  Handyman: '🔧',
  PoliceOfficer: '👮',
  Nurse: '👩‍⚕️',
  Doctor: '🩺',
  Manager: '💼',
  President: '🏆',
};

const EducationScreen: React.FC = () => {
  const navigate = useNavigate();
  const t = useLocalization();

  const currentPetIndex = useGameStore((s) => s.currentPetIndex);
  const charId = PET_CHAR_IDS[currentPetIndex] ?? 'bear';

  const careers = useCareerStore((s) => s.careers);
  const setTierActive = useCareerStore((s) => s.setTierActive);
  const tickProgress = useCareerStore((s) => s.tickProgress);
  const applyOffline = useCareerStore((s) => s.applyOfflineProgress);

  const career = careers[charId];
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    applyOffline(charId);
  }, [charId, applyOffline]);

  useEffect(() => {
    tickRef.current = setInterval(() => {
      tickProgress(charId, 1);
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [charId, tickProgress]);

  if (!career) {
    return (
      <div className={styles.root}>
        <p style={{ color: '#fff', padding: 20 }}>Loading...</p>
      </div>
    );
  }

  const highestActiveIndex = CAREER_TIERS.reduce((best, tier, i) =>
    career.activeTiers[tier] ? i : best, -1
  );

  return (
    <div className={styles.root}>
      <div className={styles.layout}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/')}>
            ← Home
          </button>
          <h1 className={styles.title}>{t('education') || 'Education'}</h1>
        </div>

        {/* Education stages */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Education Path</h2>
          <div className={styles.stageRow}>
            {EDUCATION_STAGES.map((stage, i) => {
              const tierIndex = CAREER_TIERS.indexOf(stage.minTier as CareerTier);
              const isUnlocked = highestActiveIndex >= tierIndex;
              return (
                <div
                  key={stage.label}
                  className={`${styles.stage} ${isUnlocked ? styles.stageUnlocked : styles.stageLocked}`}
                >
                  <span className={styles.stageIcon}>{stage.icon}</span>
                  <span className={styles.stageLabel}>{stage.label}</span>
                  {isUnlocked && <span className={styles.stageCheck}>✓</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Career tiers */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Career Tiers</h2>
          <div className={styles.tierList}>
            {CAREER_TIERS.map((tier, index) => {
              const isActive = career.activeTiers[tier];
              const progress = career.progress[tier];
              const color = TIER_COLORS[tier];
              const isPrevCompleted = index === 0 || career.progress[CAREER_TIERS[index - 1]] >= 100;
              const canActivate = isPrevCompleted;

              return (
                <div key={tier} className={styles.tierCard}>
                  <div className={styles.tierHeader}>
                    <span className={styles.tierIcon}>{TIER_ICONS[tier]}</span>
                    <span className={styles.tierName}>{tier}</span>
                    <div className={styles.tierActions}>
                      {progress >= 100 ? (
                        <span className={styles.tierComplete}>✓ Done</span>
                      ) : (
                        <button
                          className={`${styles.tierToggleBtn} ${
                            isActive ? styles.tierBtnActive : styles.tierBtnInactive
                          }`}
                          onClick={() => {
                            if (canActivate) setTierActive(charId, tier, !isActive);
                          }}
                          disabled={!canActivate}
                          title={canActivate ? '' : 'Complete previous tier first'}
                        >
                          {isActive ? 'Pause' : 'Start'}
                        </button>
                      )}
                    </div>
                  </div>
                  <ProgressBar
                    fill={progress / 100}
                    color={color}
                    label={`${Math.round(progress)}%`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EducationScreen;
