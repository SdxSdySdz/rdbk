import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../../stores/gameStore';
import { useLocalization } from '../../../hooks/useLocalization';
import { StatIndex, PET_CHAR_IDS } from '../../../types/game';
import ProgressBar from '../../../components/ProgressBar/ProgressBar';
import styles from './FunScreen.module.css';

const STAR_COUNT = 8;
const TAP_DELTA = 0.03;
const STAR_DELTA = 0.05;
const FUN_ANIM_FRAMES = 4;
const FUN_FPS = 2;

const PET_FUN_SPRITES: Record<string, string[]> = {
  bear: Array.from({ length: FUN_ANIM_FRAMES }, (_, i) =>
    `/assets/sprites/DailyRoutine/Fun/Bear/BearFun_${i + 1}.png`
  ),
  dog: Array.from({ length: FUN_ANIM_FRAMES }, (_, i) =>
    `/assets/sprites/DailyRoutine/Fun/Dog/DogFun_${i + 1}.png`
  ),
  frog: Array.from({ length: FUN_ANIM_FRAMES }, (_, i) =>
    `/assets/sprites/DailyRoutine/Fun/Frog/FrogFun_${i + 1}.png`
  ),
  unicorn: Array.from({ length: FUN_ANIM_FRAMES }, (_, i) =>
    `/assets/sprites/DailyRoutine/Fun/Unicorn/UnicornFun_${i + 1}.png`
  ),
};

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  popped: boolean;
}

function generateStars(): Star[] {
  return Array.from({ length: STAR_COUNT }, (_, i) => ({
    id: i,
    x: 5 + Math.random() * 88,
    y: 5 + Math.random() * 88,
    size: 24 + Math.random() * 20,
    popped: false,
  }));
}

const FunScreen: React.FC = () => {
  const navigate = useNavigate();
  const t = useLocalization();

  const pets = useGameStore((s) => s.pets);
  const currentPetIndex = useGameStore((s) => s.currentPetIndex);
  const modifyStat = useGameStore((s) => s.modifyStat);

  const currentPet = pets[currentPetIndex];
  const charId = PET_CHAR_IDS[currentPetIndex] ?? 'bear';
  const funStat = currentPet?.stats[StatIndex.Fun] ?? 0;

  const [stars, setStars] = useState<Star[]>(generateStars);
  const [complete, setComplete] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const [petError, setPetError] = useState(false);
  const [bgError, setBgError] = useState(false);

  const sprites = PET_FUN_SPRITES[charId] ?? PET_FUN_SPRITES.bear;
  const frameRef = useRef(frameIndex);
  frameRef.current = frameIndex;

  // Animate pet frames
  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % FUN_ANIM_FRAMES);
    }, 1000 / FUN_FPS);
    return () => clearInterval(interval);
  }, []);

  // Completion check
  useEffect(() => {
    if (funStat >= 1 && !complete) {
      setComplete(true);
      const timer = setTimeout(() => navigate(-1), 2000);
      return () => clearTimeout(timer);
    }
  }, [funStat, complete, navigate]);

  // Respawn stars
  useEffect(() => {
    const allPopped = stars.every((s) => s.popped);
    if (!allPopped) return;
    const timer = setTimeout(() => setStars(generateStars()), 800);
    return () => clearTimeout(timer);
  }, [stars]);

  const handleStarPop = useCallback(
    (e: React.MouseEvent, id: number) => {
      e.stopPropagation();
      setStars((prev) => prev.map((s) => (s.id === id ? { ...s, popped: true } : s)));
      modifyStat(currentPetIndex, StatIndex.Fun, STAR_DELTA);
    },
    [currentPetIndex, modifyStat]
  );

  const handleTap = useCallback(() => {
    if (complete) return;
    modifyStat(currentPetIndex, StatIndex.Fun, TAP_DELTA);
  }, [complete, currentPetIndex, modifyStat]);

  return (
    <div className={styles.root}>
      {!bgError ? (
        <img
          src="/assets/sprites/DailyRoutine/Fun/FunBg.png"
          alt=""
          className={styles.bg}
          onError={() => setBgError(true)}
        />
      ) : (
        <div className={styles.bgFallback} />
      )}

      <div className={styles.layout}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            ← Back
          </button>
          <h2 className={styles.title}>{t('fun') || 'Fun'}</h2>
          <ProgressBar fill={funStat} color="#E91E63" label={`${Math.round(funStat * 100)}%`} />
        </div>

        <div className={styles.scene} onClick={handleTap}>
          {/* Decorations */}
          <DecorImg src="/assets/sprites/DailyRoutine/Fun/TV.png" className={styles.decorTV} />
          <DecorImg src="/assets/sprites/DailyRoutine/Fun/Ball.png" className={styles.decorBall} />
          <DecorImg src="/assets/sprites/DailyRoutine/Fun/Music.png" className={styles.decorMusic} />

          {/* Pet animation */}
          <div className={styles.petArea}>
            {!petError ? (
              <img
                src={sprites[frameIndex]}
                alt="pet having fun"
                className={styles.petSprite}
                onError={() => setPetError(true)}
              />
            ) : (
              <span className={styles.petFallback}>🎉</span>
            )}
          </div>

          {/* Stars */}
          {stars.map((star) =>
            star.popped ? null : (
              <button
                key={star.id}
                className={styles.star}
                style={{
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  width: star.size,
                  height: star.size,
                }}
                onClick={(e) => handleStarPop(e, star.id)}
                aria-label="Collect star"
              >
                <StarImg />
              </button>
            )
          )}

          <p className={styles.tapHint}>Tap anywhere or catch stars!</p>
        </div>

        {complete && (
          <div className={styles.completeMsg}>
            🎉 {t('stat_full') || 'Great fun! Going back...'}
          </div>
        )}
      </div>
    </div>
  );
};

const DecorImg: React.FC<{ src: string; className: string }> = ({ src, className }) => {
  const [err, setErr] = useState(false);
  if (err) return null;
  return <img src={src} alt="" className={className} onError={() => setErr(true)} />;
};

const StarImg: React.FC = () => {
  const [err, setErr] = useState(false);
  if (err) return <span style={{ fontSize: '20px' }}>⭐</span>;
  return (
    <img
      src="/assets/sprites/DailyRoutine/Fun/Star.png"
      alt="star"
      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      onError={() => setErr(true)}
    />
  );
};

export default FunScreen;
