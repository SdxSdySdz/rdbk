import { create } from 'zustand';
import { prefs } from '../services/localStorage';
import { SPECIAL_CODES } from '../constants/game';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const PHP_URL = 'https://qwadrox.ru/referral.php';

interface ReferralStore {
  userId: string;
  referralCode: string;
  referralCount: number;
  pendingRewards: number;
  totalRewardAmount: number;
  hasSpecialCode: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  isLoading: boolean;
  codeInput: string;

  initialize: () => void;
  fetchUserData: () => Promise<void>;
  applyReferralCode: (code: string) => Promise<number>;
  claimRewards: () => Promise<void>;
  shareCode: () => void;
  setCodeInput: (v: string) => void;
  clearMessages: () => void;
}

function checkSpecialCode(code: string): boolean {
  return SPECIAL_CODES.some(c => c.toLowerCase() === code.toLowerCase());
}

export const useReferralStore = create<ReferralStore>((set, get) => ({
  userId: prefs.getString('UserID', ''),
  referralCode: prefs.getString('ReferralCode', ''),
  referralCount: prefs.getInt('ReferralCount', 0),
  pendingRewards: 0,
  totalRewardAmount: 0,
  hasSpecialCode: checkSpecialCode(prefs.getString('ReferralCode', '')),
  errorMessage: null,
  successMessage: null,
  isLoading: false,
  codeInput: '',

  initialize: () => {
    let userId = prefs.getString('UserID', '');
    if (!userId) {
      userId = generateUUID();
      prefs.setString('UserID', userId);
    }
    const referralCode = prefs.getString('ReferralCode', '');
    set({
      userId,
      referralCode,
      hasSpecialCode: checkSpecialCode(referralCode),
    });
  },

  fetchUserData: async () => {
    const { userId } = get();
    set({ isLoading: true, errorMessage: null });
    try {
      const res = await fetch(PHP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_referral_info', user_id: userId }),
      });
      const data = await res.json();
      if (data.referral_code) {
        prefs.setString('ReferralCode', data.referral_code);
        prefs.setInt('ReferralCount', data.referral_count || 0);
        set({
          referralCode: data.referral_code,
          referralCount: data.referral_count || 0,
          pendingRewards: data.pending_rewards || 0,
          totalRewardAmount: data.total_reward_amount || 0,
          hasSpecialCode: checkSpecialCode(data.referral_code),
        });
      }
    } catch {
      set({ errorMessage: 'Network error. Please try again.' });
    } finally {
      set({ isLoading: false });
    }
  },

  applyReferralCode: async (code) => {
    const { userId } = get();
    set({ isLoading: true, errorMessage: null, successMessage: null });
    const isSpecial = checkSpecialCode(code);
    try {
      const res = await fetch(PHP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'use_code', user_id: userId, code }),
      });
      const data = await res.json();
      if (data.success) {
        prefs.setString('ReferralCode', code);
        set({
          referralCode: code,
          successMessage: 'Code applied! +10000 coins',
          hasSpecialCode: isSpecial,
        });
        return 10000;
      } else {
        if (isSpecial) {
          prefs.setString('ReferralCode', code);
          set({ hasSpecialCode: true, referralCode: code, successMessage: 'Special code applied!' });
          return 10000;
        }
        set({ errorMessage: data.message || 'Invalid code' });
        return 0;
      }
    } catch {
      if (isSpecial) {
        prefs.setString('ReferralCode', code);
        set({ hasSpecialCode: true, referralCode: code, successMessage: 'Special code applied!' });
        return 10000;
      }
      set({ errorMessage: 'Network error.' });
      return 0;
    } finally {
      set({ isLoading: false });
    }
  },

  claimRewards: async () => {
    const { userId } = get();
    set({ isLoading: true });
    try {
      const res = await fetch(PHP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'claim_rewards', user_id: userId }),
      });
      const data = await res.json();
      if (data.success) {
        set({ pendingRewards: 0, successMessage: 'Rewards claimed!' });
      }
    } catch {
      set({ errorMessage: 'Network error.' });
    } finally {
      set({ isLoading: false });
    }
  },

  shareCode: () => {
    const { referralCode } = get();
    const msg = `Join me in Qwrdx! Use my referral code: ${referralCode}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(msg);
    }
  },

  setCodeInput: (v) => set({ codeInput: v }),
  clearMessages: () => set({ errorMessage: null, successMessage: null }),
}));
