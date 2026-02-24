import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../stores/gameStore';
import { useShopStore } from '../../stores/shopStore';
import { useLocalization } from '../../hooks/useLocalization';
import { PET_CHAR_IDS, StatIndex } from '../../types/game';
import { PET_SPRITES, REVIVE_COST, MAX_HEALTH_POINTS } from '../../constants/game';
import HeartDisplay from '../../components/HeartDisplay/HeartDisplay';
import CoinDisplay from '../../components/CoinDisplay/CoinDisplay';
import ProgressBar from '../../components/ProgressBar/ProgressBar';
import styles from './MainMenuScreen.module.css';

const STAT_COLORS: Record<number, string> = {
  [StatIndex.Games]: '#9C27B0',
  [StatIndex.Food]: '#FF9800',
  [StatIndex.Shower]: '#2196F3',
  [StatIndex.Education]: '#00BCD4',
  [StatIndex.Career]: '#607D8B',
  [StatIndex.Fun]: '#E91E63',
};

function getTimeOfDay(): 'day' | 'night' {
  const h = new Date().getHours();
  return h >= 6 && h < 20 ? 'day' : 'night';
}

const PetThumbnail: React.FC<{
  charId: string;
  isSelected: boolean;
  onClick: () => void;
}> = ({ charId, isSelected, onClick }) => {
  const [imgError, setImgError] = useState(false);
  const src = imgError ? '' : PET_SPRITES[charId];

  return (
    <button
      className={`${styles.petThumb} ${isSelected ? styles.petThumbSelected : ''}`}
      onClick={onClick}
      aria-label={charId}
    >
      {src ? (
        <img
          src={src}
          alt={charId}
          className={styles.petThumbImg}
          onError={() => setImgError(true)}
        />
      ) : (
        <span className={styles.petThumbFallback}>{charId[0].toUpperCase()}</span>
      )}
    </button>
  );
};

const PetSpriteImage: React.FC<{ charId: string }> = ({ charId }) => {
  const getEquippedSprite = useShopStore((s) => s.getEquippedSprite);
  const equippedSprite = getEquippedSprite(charId);
  const defaultSrc = PET_SPRITES[charId] ?? '/assets/sprites/DailyRoutine/Food/Bear/BearFood_1.png';
  const [src, setSrc] = useState(equippedSprite ?? defaultSrc);
  const [failed, setFailed] = useState(false);

  const handleError = () => {
    if (!failed) {
      setFailed(true);
      setSrc(defaultSrc);
    }
  };

  return (
    <img
      src={src}
      alt={charId}
      className={styles.petImage}
      onError={handleError}
      draggable={false}
    />
  );
};

const ShopCurrencyDisplay: React.FC = () => {
  const currency = useShopStore((s) => s.currency);
  return (
    <div className={styles.currency}>
      <span className={styles.currencyLabel}>💎 Shop: {currency}</span>
    </div>
  );
};

const MainMenuScreen: React.FC = () => {
  const navigate = useNavigate();
  const t = useLocalization();

  const pets = useGameStore((s) => s.pets);
  const currentPetIndex = useGameStore((s) => s.currentPetIndex);
  const money = useGameStore((s) => s.money);
  const setCurrentPet = useGameStore((s) => s.setCurrentPet);
  const setPetName = useGameStore((s) => s.setPetName);
  const revivePet = useGameStore((s) => s.revivePet);
  const hasSpecialCode = useGameStore((s) => s.hasSpecialCode);
  const checkAndApplyOfflineProgress = useGameStore((s) => s.checkAndApplyOfflineProgress);

  const [timeOfDay, setTimeOfDay] = useState<'day' | 'night'>(getTimeOfDay());
  const [nameInput, setNameInput] = useState('');
  const [bgError, setBgError] = useState(false);

  const currentPet = pets[currentPetIndex];

  useEffect(() => {
    checkAndApplyOfflineProgress();
    const interval = setInterval(() => {
      setTimeOfDay(getTimeOfDay());
    }, 60000);
    return () => clearInterval(interval);
  }, [checkAndApplyOfflineProgress]);

  useEffect(() => {
    if (currentPet) setNameInput(currentPet.petName);
  }, [currentPetIndex, currentPet]);

  const handleNameBlur = () => {
    const trimmed = nameInput.trim();
    if (trimmed && trimmed !== currentPet?.petName) {
      setPetName(currentPetIndex, trimmed);
    }
  };

  const dyingPets = pets.filter((p) => p.healthPoints <= 3 && p.healthPoints > 0);
  const deadPets = pets.filter((p) => p.healthPoints <= 0);

  const statLabels: Record<number, string> = {
    [StatIndex.Games]: t('games') || 'Games',
    [StatIndex.Food]: t('food') || 'Food',
    [StatIndex.Shower]: t('shower') || 'Shower',
    [StatIndex.Education]: t('education') || 'Education',
    [StatIndex.Career]: t('career') || 'Career',
    [StatIndex.Fun]: t('fun') || 'Fun',
  };

  return (
    <div className={styles.root}>
      {/* Background */}
      {!bgError ? (
        <img
          src="/assets/sprites/Backgraund.png"
          alt=""
          className={styles.bg}
          onError={() => setBgError(true)}
        />
      ) : (
        <div className={styles.bgFallback} />
      )}

      {/* Day/night overlay */}
      <div className={`${styles.timeOverlay} ${timeOfDay === 'night' ? styles.nightOverlay : styles.dayOverlay}`}>
        <span className={styles.timeIcon}>{timeOfDay === 'day' ? '☀️' : '🌙'}</span>
      </div>

      <div className={styles.layout}>
        {/* Top bar: coins */}
        <div className={styles.topBar}>
          <CoinDisplay amount={money} />
          <ShopCurrencyDisplay />
        </div>

        {/* Pet selector */}
        <div className={styles.petSelectorRow}>
          {PET_CHAR_IDS.map((id, i) => (
            <PetThumbnail
              key={id}
              charId={id}
              isSelected={i === currentPetIndex}
              onClick={() => setCurrentPet(i)}
            />
          ))}
        </div>

        {/* Main area */}
        <div className={styles.mainArea}>
          {/* Pet display column */}
          <div className={styles.petColumn}>
            <input
              className={styles.nameInput}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={handleNameBlur}
              maxLength={20}
              placeholder="Pet name"
            />
            <div className={styles.petImageWrapper}>
              <PetSpriteImage charId={PET_CHAR_IDS[currentPetIndex]} />
              {currentPet && currentPet.healthPoints <= 0 && (
                <div className={styles.deadOverlay}>💀</div>
              )}
            </div>
            <div className={styles.heartsRow}>
              <HeartDisplay current={currentPet?.healthPoints ?? 0} max={MAX_HEALTH_POINTS} />
            </div>
          </div>

          {/* Stats panel */}
          <div className={styles.statsPanel}>
            {[
              StatIndex.Games,
              StatIndex.Food,
              StatIndex.Shower,
              StatIndex.Education,
              StatIndex.Career,
              StatIndex.Fun,
            ].map((si) => (
              <div key={si} className={styles.statRow}>
                <span className={styles.statLabel}>{statLabels[si]}</span>
                <ProgressBar
                  fill={currentPet?.stats[si] ?? 0}
                  color={STAT_COLORS[si]}
                  label={`${Math.round((currentPet?.stats[si] ?? 0) * 100)}%`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Die panel */}
        {(dyingPets.length > 0 || deadPets.length > 0) && (
          <div className={styles.diePanel}>
            {deadPets.length > 0 && (
              <div className={styles.diePanelRow}>
                <span className={styles.dieWarning}>
                  💀 {deadPets.length} pet(s) dead!
                </span>
                <button
                  className={styles.reviveBtn}
                  onClick={() => {
                    pets.forEach((p, i) => {
                      if (p.healthPoints <= 0) revivePet(i);
                    });
                  }}
                >
                  {hasSpecialCode ? 'Revive (FREE)' : `Revive (${REVIVE_COST} coins)`}
                </button>
              </div>
            )}
            {dyingPets.length > 0 && (
              <div className={styles.dieWarning}>
                ⚠️ {dyingPets.length} pet(s) in danger!
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className={styles.actionGrid}>
          <button className={`${styles.actionBtn} ${styles.btnFood}`} onClick={() => navigate('/daily-routine/food')}>
            🍎 Food
          </button>
          <button className={`${styles.actionBtn} ${styles.btnShower}`} onClick={() => navigate('/daily-routine/shower')}>
            🚿 Shower
          </button>
          <button className={`${styles.actionBtn} ${styles.btnFun}`} onClick={() => navigate('/daily-routine/fun')}>
            🎉 Fun
          </button>
          <button className={`${styles.actionBtn} ${styles.btnEdu}`} onClick={() => navigate('/education')}>
            📚 Education
          </button>
          <button className={`${styles.actionBtn} ${styles.btnShop}`} onClick={() => navigate('/shop')}>
            🛒 Shop
          </button>
          <button className={`${styles.actionBtn} ${styles.btnGames}`} onClick={() => navigate('/mini-games')}>
            🎮 Games
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainMenuScreen;
