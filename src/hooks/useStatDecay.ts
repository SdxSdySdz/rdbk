import { useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';

export function useStatDecay() {
  const checkAndApplyOfflineProgress = useGameStore(s => s.checkAndApplyOfflineProgress);

  useEffect(() => {
    // On mount
    checkAndApplyOfflineProgress();

    // On visibility change
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkAndApplyOfflineProgress();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Periodic check every 600s
    const interval = setInterval(checkAndApplyOfflineProgress, 600_000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, [checkAndApplyOfflineProgress]);
}
