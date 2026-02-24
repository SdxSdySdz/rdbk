import React, { useState } from 'react';
import { useShopStore } from '../../stores/shopStore';
import { PET_SPRITES } from '../../constants/game';
import styles from './PetSprite.module.css';

interface Props {
  charId: string;
  size?: number;
  animated?: boolean;
}

const PetSprite: React.FC<Props> = ({ charId, size = 120, animated = false }) => {
  const getEquippedSprite = useShopStore((s) => s.getEquippedSprite);
  const equippedSprite = getEquippedSprite(charId);
  const defaultSprite = PET_SPRITES[charId] ?? '/assets/sprites/DailyRoutine/Food/Bear/BearFood_1.png';

  const [src, setSrc] = useState<string>(equippedSprite ?? defaultSprite);
  const [failed, setFailed] = useState(false);

  const handleError = () => {
    if (!failed) {
      setFailed(true);
      setSrc(defaultSprite);
    }
  };

  return (
    <div
      className={`${styles.container} ${animated ? styles.animated : ''}`}
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt={charId}
        className={styles.sprite}
        onError={handleError}
        draggable={false}
      />
    </div>
  );
};

export default PetSprite;
