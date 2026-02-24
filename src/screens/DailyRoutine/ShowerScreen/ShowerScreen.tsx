import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../../stores/gameStore';
import { useLocalization } from '../../../hooks/useLocalization';
import { StatIndex, PET_CHAR_IDS } from '../../../types/game';
import ProgressBar from '../../../components/ProgressBar/ProgressBar';
import styles from './ShowerScreen.module.css';

const BUBBLE_COUNT = 8;
const TAP_DELTA = 0.03;
const BUBBLE_DELTA = 0.05;

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  popped: boolean;
}

function generateBubbles(): Bubble[] {
  return Array.from({ length: BUBBLE_COUNT }, (_, i) => ({
    id: i,
    x: 10 + Math.random() * 80,
    y: 10 + Math.random() * 80,
    size: 28 + Math.random() * 24,
    popped: false,
  }));
}

const ShowerScreen: React.FC = () => {
  const navigate = useNavigate();
  const t = useLocalization();

  const pets = useGameStore((s) => s.pets);
  const currentPetIndex = useGameStore((s) => s.currentPetIndex);
  const modifyStat = useGameStore((s) => s.modifyStat);

  const currentPet = pets[currentPetIndex];
  const charId = PET_CHAR_IDS[currentPetIndex] ?? 'bear';
  const showerStat = currentPet?.stats[StatIndex.Shower] ?? 0;

  const [bubbles, setBubbles] = useState<Bubble[]>(generateBubbles);
  const [complete, setComplete] = useState(false);
  const [bgError, setBgError] = useState(false);
  const [bathBackError, setBathBackError] = useState(false);
  const [bathFrontError, setBathFrontError] = useState(false);
  const [petError, setPetError] = useState(false);

  useEffect(() => {
    if (showerStat >= 1 && !complete) {
      setComplete(true);
      const timer = setTimeout(() => navigate(-1), 2000);
      return () => clearTimeout(timer);
    }
  }, [showerStat, complete, navigate]);

  // Respawn popped bubbles after a delay
  useEffect(() => {
    const allPopped = bubbles.every((b) => b.popped);
    if (!allPopped) return;
    const timer = setTimeout(() => {
      setBubbles(generateBubbles());
    }, 800);
    return () => clearTimeout(timer);
  }, [bubbles]);

  const handleBubblePop = useCallback(
    (e: React.MouseEvent, id: number) => {
      e.stopPropagation();
      setBubbles((prev) =>
        prev.map((b) => (b.id === id ? { ...b, popped: true } : b))
      );
      modifyStat(currentPetIndex, StatIndex.Shower, BUBBLE_DELTA);
    },
    [currentPetIndex, modifyStat]
  );

  const handleTapZone = useCallback(() => {
    if (complete) return;
    modifyStat(currentPetIndex, StatIndex.Shower, TAP_DELTA);
  }, [complete, currentPetIndex, modifyStat]);

  const petSpriteMap: Record<string, string> = {
    bear: '/assets/sprites/DailyRoutine/Shower/Bear/BearShower_1.png',
    frog: '/assets/sprites/DailyRoutine/Shower/Frog/FrogShower_1.png',
    dog: '/assets/sprites/DailyRoutine/Shower/Dog/DogShower_1.png',
    unicorn: '/assets/sprites/DailyRoutine/Shower/Unicorn/UnicornShower_1.png',
  };
  const petSprite = petSpriteMap[charId] ?? petSpriteMap.bear;

  return (
    <div className={styles.root}>
      {!bgError ? (
        <img
          src="/assets/sprites/DailyRoutine/Shower/ShowerBg.png"
          alt=""
          className={styles.bg}
          onError={() => setBgError(true)}
        />
      ) : (
        <div className={styles.bgFallback} />
      )}

      <div className={styles.layout}>
        {/* Header */}
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            ← Back
          </button>
          <h2 className={styles.title}>{t('shower') || 'Shower'}</h2>
          <ProgressBar fill={showerStat} color="#2196F3" label={`${Math.round(showerStat * 100)}%`} />
        </div>

        {/* Tap zone / scene */}
        <div className={styles.scene} onClick={handleTapZone}>
          {/* Bath back */}
          {!bathBackError && (
            <img
              src="/assets/sprites/DailyRoutine/Shower/BathBack.png"
              alt=""
              className={styles.bathBack}
              onError={() => setBathBackError(true)}
            />
          )}

          {/* Pet */}
          <div className={styles.petArea}>
            {!petError ? (
              <img
                src={petSprite}
                alt="pet showering"
                className={styles.petSprite}
                onError={() => setPetError(true)}
              />
            ) : (
              <span className={styles.petFallback}>🚿</span>
            )}
          </div>

          {/* Bubbles */}
          {bubbles.map((bubble) =>
            bubble.popped ? null : (
              <button
                key={bubble.id}
                className={styles.bubble}
                style={{
                  left: `${bubble.x}%`,
                  top: `${bubble.y}%`,
                  width: bubble.size,
                  height: bubble.size,
                }}
                onClick={(e) => handleBubblePop(e, bubble.id)}
                aria-label="Pop bubble"
              >
                <BubbleImg />
              </button>
            )
          )}

          {/* Bath front */}
          {!bathFrontError && (
            <img
              src="/assets/sprites/DailyRoutine/Shower/BathFront.png"
              alt=""
              className={styles.bathFront}
              onError={() => setBathFrontError(true)}
            />
          )}

          <p className={styles.tapHint}>Tap anywhere or pop bubbles!</p>
        </div>

        {complete && (
          <div className={styles.completeMsg}>
            ✅ {t('stat_full') || 'All clean! Going back...'}
          </div>
        )}
      </div>
    </div>
  );
};

const BubbleImg: React.FC = () => {
  const [err, setErr] = useState(false);
  if (err) return <span style={{ fontSize: '20px' }}>🫧</span>;
  return (
    <img
      src="/assets/sprites/DailyRoutine/Shower/Bubble.png"
      alt="bubble"
      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      onError={() => setErr(true)}
    />
  );
};

export default ShowerScreen;
