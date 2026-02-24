import React from 'react';
import styles from './ProgressBar.module.css';

interface Props {
  fill: number;
  color?: string;
  label?: string;
}

const ProgressBar: React.FC<Props> = ({ fill, color = '#4CAF50', label }) => {
  const clampedFill = Math.max(0, Math.min(1, fill));
  return (
    <div className={styles.container}>
      <div
        className={styles.bar}
        style={{ width: `${clampedFill * 100}%`, backgroundColor: color }}
      />
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
};

export default ProgressBar;
