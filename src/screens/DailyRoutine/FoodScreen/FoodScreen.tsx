import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../../stores/gameStore';
import { useLocalization } from '../../../hooks/useLocalization';
import { StatIndex, PET_CHAR_IDS } from '../../../types/game';
import { FOOD_ITEMS } from '../../../constants/game';
import ProgressBar from '../../../components/ProgressBar/ProgressBar';
import styles from './FoodScreen.module.css';

const BITES_START = 10;
const STAT_PER_BITE = 0.07;

interface FoodItem {
  id: string;
  sprite: string;
  label: string;
}

interface FoodState {
  bitesLeft: number;
  gone: boolean;
}

const FoodScreen: React.FC = () => {
  const navigate = useNavigate();
  const t = useLocalization();

  const pets = useGameStore((s) => s.pets);
  const currentPetIndex = useGameStore((s) => s.currentPetIndex);
  const modifyStat = useGameStore((s) => s.modifyStat);

  const currentPet = pets[currentPetIndex];
  const charId = PET_CHAR_IDS[currentPetIndex] ?? 'bear';

  const [foodStates, setFoodStates] = useState<FoodState[]>(
    FOOD_ITEMS.map(() => ({ bitesLeft: BITES_START, gone: false }))
  );
  const [complete, setComplete] = useState(false);
  const [bearImgError, setBearImgError] = useState(false);
  const [bgError, setBgError] = useState(false);
  const [tableError, setTableError] = useState(false);

  const foodStat = currentPet?.stats[StatIndex.Food] ?? 0;

  useEffect(() => {
    if (foodStat >= 1 && !complete) {
      setComplete(true);
      const timer = setTimeout(() => navigate(-1), 2000);
      return () => clearTimeout(timer);
    }
  }, [foodStat, complete, navigate]);

  const handleBite = (index: number) => {
    if (foodStates[index].gone || complete) return;

    const updated = [...foodStates];
    const newBites = updated[index].bitesLeft - 1;
    updated[index] = {
      bitesLeft: Math.max(0, newBites),
      gone: newBites <= 0,
    };
    setFoodStates(updated);
    modifyStat(currentPetIndex, StatIndex.Food, STAT_PER_BITE);
  };

  const bearSprite =
    charId === 'bear'
      ? '/assets/sprites/DailyRoutine/Food/Bear/BearFood_1.png'
      : `/assets/sprites/DailyRoutine/Food/${charId.charAt(0).toUpperCase() + charId.slice(1)}/${charId.charAt(0).toUpperCase() + charId.slice(1)}Food_1.png`;

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
        {/* Header */}
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            ← Back
          </button>
          <h2 className={styles.title}>{t('food') || 'Food'}</h2>
          <ProgressBar fill={foodStat} color="#FF9800" label={`${Math.round(foodStat * 100)}%`} />
        </div>

        {/* Scene */}
        <div className={styles.scene}>
          {!tableError ? (
            <img
              src="/assets/sprites/DailyRoutine/Food/Table.png"
              alt="table"
              className={styles.table}
              onError={() => setTableError(true)}
            />
          ) : null}

          {/* Pet */}
          <div className={styles.petArea}>
            {!bearImgError ? (
              <img
                src={bearSprite}
                alt="pet eating"
                className={styles.petSprite}
                onError={() => setBearImgError(true)}
              />
            ) : (
              <div className={styles.petFallback}>🐻</div>
            )}
          </div>

          {/* Food items */}
          <div className={styles.foodRow}>
            {FOOD_ITEMS.map((item: FoodItem, i: number) => {
              const state = foodStates[i];
              if (state.gone) return <div key={item.id} className={styles.foodSlot} />;
              const scale = 0.5 + 0.5 * (state.bitesLeft / BITES_START);
              return (
                <button
                  key={item.id}
                  className={styles.foodItem}
                  onClick={() => handleBite(i)}
                  aria-label={item.label}
                  style={{ transform: `scale(${scale})` }}
                >
                  <FoodImg src={item.sprite} label={item.label} />
                  <span className={styles.biteCount}>{state.bitesLeft}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Completion */}
        {complete && (
          <div className={styles.completeMsg}>
            ✅ {t('stat_full') || 'Your pet is full! Going back...'}
          </div>
        )}
      </div>
    </div>
  );
};

const FoodImg: React.FC<{ src: string; label: string }> = ({ src, label }) => {
  const [err, setErr] = useState(false);
  const EMOJIS: Record<string, string> = { Apple: '🍎', Pizza: '🍕', Burger: '🍔', Milk: '🥛' };
  if (err) return <span className={styles.foodEmoji}>{EMOJIS[label] ?? '🍽️'}</span>;
  return <img src={src} alt={label} className={styles.foodImg} onError={() => setErr(true)} />;
};

export default FoodScreen;
