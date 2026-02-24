import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../stores/gameStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useLocalization } from '../../hooks/useLocalization';
import styles from './BankScreen.module.css';

const BankScreen: React.FC = () => {
  const navigate = useNavigate();
  const t = useLocalization();

  const money = useGameStore((s) => s.money);
  const bep20Address = useSettingsStore((s) => s.bep20Address);
  const setBep20Address = useSettingsStore((s) => s.setBep20Address);

  const [addressInput, setAddressInput] = useState(bep20Address);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [bgError, setBgError] = useState(false);

  const handleSaveAddress = () => {
    const trimmed = addressInput.trim();
    if (!trimmed.startsWith('0x') || trimmed.length < 40) {
      setMessage({ text: 'Invalid BEP-20 address. Must start with 0x and be at least 40 chars.', type: 'error' });
      return;
    }
    setBep20Address(trimmed);
    setMessage({ text: 'Address saved!', type: 'success' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setMessage({ text: 'Please enter a valid amount.', type: 'error' });
      return;
    }
    if (!bep20Address || bep20Address.length < 40) {
      setMessage({ text: 'Please set a valid BEP-20 address first.', type: 'error' });
      return;
    }
    if (amount > money) {
      setMessage({ text: 'Insufficient balance.', type: 'error' });
      return;
    }
    // In a real implementation this would call an API
    setMessage({ text: `Withdrawal request submitted for ${amount} coins to ${bep20Address.slice(0, 10)}...`, type: 'success' });
    setWithdrawAmount('');
    setTimeout(() => setMessage(null), 4000);
  };

  return (
    <div className={styles.root}>
      {!bgError ? (
        <img
          src="/assets/sprites/bank/bg.png"
          alt=""
          className={styles.bg}
          onError={() => setBgError(true)}
        />
      ) : (
        <div className={styles.bgFallback} />
      )}

      <div className={styles.layout}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/')}>
            ← Home
          </button>
          <h1 className={styles.title}>{t('bank') || 'Bank'}</h1>
        </div>

        {/* Balance card */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Current Balance</h2>
          <div className={styles.balanceDisplay}>
            <span className={styles.balanceCoin}>🪙</span>
            <span className={styles.balanceAmount}>{money.toLocaleString()}</span>
            <span className={styles.balanceLabel}>coins</span>
          </div>
        </div>

        {/* BEP-20 address */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>BEP-20 Wallet Address</h2>
          <input
            className={styles.addressInput}
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            placeholder="0x..."
            spellCheck={false}
          />
          <button
            className={`${styles.btn} ${styles.btnSave}`}
            onClick={handleSaveAddress}
          >
            Save Address
          </button>
          {bep20Address && (
            <p className={styles.savedAddress}>
              Saved: {bep20Address.slice(0, 12)}...{bep20Address.slice(-6)}
            </p>
          )}
        </div>

        {/* Withdraw */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Withdraw</h2>
          <p className={styles.withdrawNote}>
            Enter the amount of coins you want to withdraw to your BEP-20 wallet.
          </p>
          <input
            className={styles.withdrawInput}
            type="number"
            min="1"
            max={money}
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="Amount..."
          />
          <button
            className={`${styles.btn} ${styles.btnWithdraw}`}
            onClick={handleWithdraw}
            disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
          >
            Withdraw
          </button>
        </div>

        {message && (
          <div className={`${styles.message} ${message.type === 'error' ? styles.msgError : styles.msgSuccess}`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default BankScreen;
