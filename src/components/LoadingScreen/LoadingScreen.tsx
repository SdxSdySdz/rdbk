import React from 'react';
import styles from './LoadingScreen.module.css';

interface Props {
  message?: string;
}

const LoadingScreen: React.FC<Props> = ({ message = 'Loading...' }) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <div className={styles.spinner} />
        <p className={styles.message}>{message}</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
