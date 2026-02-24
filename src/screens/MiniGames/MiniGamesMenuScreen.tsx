import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMiniGameStore } from '../../stores/miniGameStore';
import { useReferralStore } from '../../stores/referralStore';
import { useLocalization } from '../../hooks/useLocalization';
import type { MiniGameType } from '../../types/game';
import {
  PLATFORMER_LEVELS,
  CATCHING_FROM_SKY_LEVELS,
  CATCHING_FROM_ALL_SIDES_LEVELS,
} from '../../constants/miniGames';
import styles from './MiniGamesMenuScreen.module.css';

interface GameCard {
  type: MiniGameType;
  title: string;
  icon: string;
  description: string;
  basePath: string;
}

const GAME_CARDS: GameCard[] = [
  {
    type: 'Platformer',
    title: 'Platformer',
    icon: '🏃',
    description: 'Run, jump and collect coins!',
    basePath: '/mini-games/platformer',
  },
  {
    type: 'CatchingFromSky',
    title: 'Catch from Sky',
    icon: '🌧️',
    description: 'Catch falling coins, dodge spikes!',
    basePath: '/mini-games/catching-from-sky',
  },
  {
    type: 'CatchingFromAllSides',
    title: 'Catch All Sides',
    icon: '🎯',
    description: 'Coins rain from all directions!',
    basePath: '/mini-games/catching-from-all-sides',
  },
];

const LEVEL_CONFIGS: Record<MiniGameType, { number: number; access: string }[]> = {
  Platformer: PLATFORMER_LEVELS,
  CatchingFromSky: CATCHING_FROM_SKY_LEVELS,
  CatchingFromAllSides: CATCHING_FROM_ALL_SIDES_LEVELS,
};

const MiniGamesMenuScreen: React.FC = () => {
  const navigate = useNavigate();
  const t = useLocalization();

  const isLevelUnlocked = useMiniGameStore((s) => s.isLevelUnlocked);
  const getLevelCompleted = useMiniGameStore((s) => s.getLevelCompleted);
  const referralCount = useReferralStore((s) => s.referralCount);

  const handleLevelClick = (type: MiniGameType, level: number, basePath: string) => {
    const unlocked = isLevelUnlocked(type, level, referralCount);
    if (!unlocked) return;
    navigate(`${basePath}/level/${level}`);
  };

  return (
    <div className={styles.root}>
      <div className={styles.layout}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/')}>
            ← Home
          </button>
          <h1 className={styles.title}>{t('mini_games') || 'Mini Games'}</h1>
        </div>

        <div className={styles.gameList}>
          {GAME_CARDS.map((card) => {
            const levels = LEVEL_CONFIGS[card.type];
            return (
              <div key={card.type} className={styles.gameCard}>
                <div className={styles.gameCardHeader}>
                  <span className={styles.gameIcon}>{card.icon}</span>
                  <div className={styles.gameInfo}>
                    <h2 className={styles.gameTitle}>{card.title}</h2>
                    <p className={styles.gameDesc}>{card.description}</p>
                  </div>
                </div>

                <div className={styles.levelRow}>
                  {levels.map((levelCfg) => {
                    const isUnlocked = isLevelUnlocked(card.type, levelCfg.number, referralCount);
                    const isCompleted = getLevelCompleted(card.type, levelCfg.number);
                    const isNeedsReferral = levelCfg.access === 'NeedsTwoReferrals' && !isUnlocked;

                    let btnClass = styles.levelBtn;
                    if (isCompleted) btnClass = `${styles.levelBtn} ${styles.levelCompleted}`;
                    else if (!isUnlocked) btnClass = `${styles.levelBtn} ${styles.levelLocked}`;
                    else btnClass = `${styles.levelBtn} ${styles.levelAvailable}`;

                    return (
                      <button
                        key={levelCfg.number}
                        className={btnClass}
                        onClick={() => handleLevelClick(card.type, levelCfg.number, card.basePath)}
                        disabled={!isUnlocked}
                        title={
                          isNeedsReferral
                            ? `Need 2 referrals (have ${referralCount})`
                            : !isUnlocked
                            ? 'Complete previous level first'
                            : `Level ${levelCfg.number}`
                        }
                      >
                        {isCompleted ? '✓' : isNeedsReferral ? '👥' : !isUnlocked ? '🔒' : levelCfg.number}
                        {isNeedsReferral && (
                          <span className={styles.referralHint}>2 refs</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {referralCount < 2 && (
          <div className={styles.referralNotice}>
            <span>👥 Invite 2 friends to unlock advanced levels!</span>
            <span className={styles.referralProgress}>
              {referralCount}/2 friends invited
            </span>
            <button
              className={styles.goFriendsBtn}
              onClick={() => navigate('/friends')}
            >
              Invite Friends
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MiniGamesMenuScreen;
