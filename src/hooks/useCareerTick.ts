import { useEffect, useRef } from 'react';
import { useCareerStore } from '../stores/careerStore';
import { PET_CHAR_IDS } from '../types/game';

export function useCareerTick() {
  const tickProgress = useCareerStore(s => s.tickProgress);
  const saveAll = useCareerStore(s => s.saveAll);
  const lastTimestamp = useRef<number>(0);
  const rafId = useRef<number>(0);
  const lastSaveTime = useRef<number>(Date.now());

  useEffect(() => {
    const tick = (timestamp: number) => {
      if (lastTimestamp.current > 0) {
        const dt = (timestamp - lastTimestamp.current) / 1000;
        PET_CHAR_IDS.forEach(id => tickProgress(id, dt));

        // Save every 30 seconds
        if (Date.now() - lastSaveTime.current > 30_000) {
          saveAll();
          lastSaveTime.current = Date.now();
        }
      }
      lastTimestamp.current = timestamp;
      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId.current);
      saveAll();
    };
  }, [tickProgress, saveAll]);
}
