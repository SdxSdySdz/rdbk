import React from 'react';
import styles from './HeartDisplay.module.css';

interface Props {
  current: number;
  max?: number;
}

const HeartDisplay: React.FC<Props> = ({ current, max = 8 }) => {
  const clampedCurrent = Math.max(0, Math.min(max, Math.round(current)));
  return (
    <div className={styles.container}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={styles.heart}
          role="img"
          aria-label={i < clampedCurrent ? 'full heart' : 'empty heart'}
        >
          {i < clampedCurrent ? '❤️' : '🤍'}
        </span>
      ))}
    </div>
  );
};

export default HeartDisplay;
