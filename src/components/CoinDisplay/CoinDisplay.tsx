import React, { useState } from 'react';
import styles from './CoinDisplay.module.css';

interface Props {
  amount: number;
}

const CoinDisplay: React.FC<Props> = ({ amount }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className={styles.container}>
      {!imgError ? (
        <img
          src="/assets/sprites/UI/Ic_coin.png"
          alt="coin"
          className={styles.icon}
          onError={() => setImgError(true)}
        />
      ) : (
        <span className={styles.fallbackIcon}>🪙</span>
      )}
      <span className={styles.amount}>{amount.toLocaleString()}</span>
    </div>
  );
};

export default CoinDisplay;
