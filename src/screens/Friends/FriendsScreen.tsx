import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReferralStore } from '../../stores/referralStore';
import { useGameStore } from '../../stores/gameStore';
import { useLocalization } from '../../hooks/useLocalization';
import styles from './FriendsScreen.module.css';

const FriendsScreen: React.FC = () => {
  const navigate = useNavigate();
  const t = useLocalization();

  const referralCode = useReferralStore((s) => s.referralCode);
  const referralCount = useReferralStore((s) => s.referralCount);
  const pendingRewards = useReferralStore((s) => s.pendingRewards);
  const totalRewardAmount = useReferralStore((s) => s.totalRewardAmount);
  const errorMessage = useReferralStore((s) => s.errorMessage);
  const successMessage = useReferralStore((s) => s.successMessage);
  const isLoading = useReferralStore((s) => s.isLoading);
  const codeInput = useReferralStore((s) => s.codeInput);

  const fetchUserData = useReferralStore((s) => s.fetchUserData);
  const applyReferralCode = useReferralStore((s) => s.applyReferralCode);
  const claimRewards = useReferralStore((s) => s.claimRewards);
  const shareCode = useReferralStore((s) => s.shareCode);
  const setCodeInput = useReferralStore((s) => s.setCodeInput);
  const clearMessages = useReferralStore((s) => s.clearMessages);

  const addMoney = useGameStore((s) => s.addMoney);
  const setHasSpecialCode = useGameStore((s) => s.setHasSpecialCode);
  const hasSpecialCode = useReferralStore((s) => s.hasSpecialCode);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleShare = () => {
    shareCode();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = async () => {
    const trimmed = codeInput.trim();
    if (!trimmed) return;
    const amount = await applyReferralCode(trimmed);
    if (amount > 0) {
      addMoney(amount);
      if (useReferralStore.getState().hasSpecialCode) {
        setHasSpecialCode(true);
      }
    }
    setCodeInput('');
  };

  const handleClaim = async () => {
    await claimRewards();
    if (pendingRewards > 0) {
      addMoney(pendingRewards);
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.layout}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/')}>
            ← Home
          </button>
          <h1 className={styles.title}>{t('friends') || 'Friends'}</h1>
        </div>

        {/* Your code */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Your Referral Code</h2>
          <div className={styles.codeDisplay}>
            <span className={styles.codeText}>{referralCode || 'Loading...'}</span>
          </div>
          <button
            className={`${styles.btn} ${styles.btnShare}`}
            onClick={handleShare}
            disabled={!referralCode}
          >
            {copied ? '✓ Copied!' : '📋 Share Code'}
          </button>
          <div className={styles.inviteCount}>
            <span>👥 Invited: <strong>{referralCount}</strong> friends</span>
          </div>
          {hasSpecialCode && (
            <div className={styles.specialBadge}>⭐ Special Code Active — Unlimited Access!</div>
          )}
        </div>

        {/* Enter code */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Enter a Friend's Code</h2>
          <div className={styles.inputRow}>
            <input
              className={styles.codeInput}
              value={codeInput}
              onChange={(e) => {
                clearMessages();
                setCodeInput(e.target.value.toUpperCase());
              }}
              placeholder="Enter code..."
              maxLength={20}
            />
            <button
              className={`${styles.btn} ${styles.btnApply}`}
              onClick={handleApply}
              disabled={isLoading || !codeInput.trim()}
            >
              {isLoading ? '...' : 'Apply'}
            </button>
          </div>
          {errorMessage && <p className={styles.errorMsg}>{errorMessage}</p>}
          {successMessage && <p className={styles.successMsg}>{successMessage}</p>}
        </div>

        {/* Rewards */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Referral Rewards</h2>
          <div className={styles.rewardInfo}>
            <div className={styles.rewardRow}>
              <span>Pending rewards:</span>
              <strong className={styles.rewardValue}>{pendingRewards}</strong>
            </div>
            <div className={styles.rewardRow}>
              <span>Total earned:</span>
              <strong className={styles.rewardValue}>{totalRewardAmount}</strong>
            </div>
          </div>
          <button
            className={`${styles.btn} ${styles.btnClaim}`}
            onClick={handleClaim}
            disabled={isLoading || pendingRewards <= 0}
          >
            {isLoading ? 'Claiming...' : `Claim ${pendingRewards} Coins`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FriendsScreen;
