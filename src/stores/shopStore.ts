import { create } from 'zustand';
import { prefs } from '../services/localStorage';
import { PET_CHAR_IDS } from '../types/game';
import { SHOP_ITEMS } from '../constants/shop';
import type { CareerTier } from './careerStore';

export interface ShopItemState {
  isPurchased: boolean;
  isEquipped: boolean;
}

interface ShopStore {
  items: Record<string, ShopItemState[]>; // charId → item states
  currency: number; // common_currency
  lastReferralCounts: Record<string, number>;

  loadAll: () => void;
  saveAll: () => void;
  purchaseItem: (charId: string, itemIndex: number, hasSpecialCode: boolean) => boolean;
  equipItem: (charId: string, itemIndex: number) => void;
  getEquippedIndex: (charId: string) => number;
  getEquippedSprite: (charId: string) => string | null;
  addCurrency: (amount: number) => void;
  checkCareerAutoPurchase: (charId: string, activeTiers: Record<CareerTier, boolean>, hasSpecialCode: boolean) => void;
}

function loadItems(charId: string): ShopItemState[] {
  return SHOP_ITEMS.map((_, i) => ({
    isPurchased: prefs.getBool(`skin_${charId}_purchased_${i}`, false),
    isEquipped: prefs.getBool(`skin_${charId}_equipped_${i}`, false),
  }));
}

function saveItems(charId: string, items: ShopItemState[]) {
  items.forEach((item, i) => {
    prefs.setBool(`skin_${charId}_purchased_${i}`, item.isPurchased);
    prefs.setBool(`skin_${charId}_equipped_${i}`, item.isEquipped);
  });
  const equippedIndex = items.findIndex(i => i.isEquipped);
  prefs.setInt(`skin_${charId}_equippedIndex`, equippedIndex);
}

export const useShopStore = create<ShopStore>((set, get) => ({
  items: Object.fromEntries(PET_CHAR_IDS.map(id => [id, loadItems(id)])),
  currency: prefs.getInt('common_currency', 0),
  lastReferralCounts: Object.fromEntries(
    PET_CHAR_IDS.map(id => [id, prefs.getInt(`lastReferralCount_${id}`, 0)])
  ),

  loadAll: () => {
    const items = Object.fromEntries(PET_CHAR_IDS.map(id => [id, loadItems(id)]));
    set({ items, currency: prefs.getInt('common_currency', 0) });
  },

  saveAll: () => {
    const { items, currency } = get();
    PET_CHAR_IDS.forEach(id => saveItems(id, items[id]));
    prefs.setInt('common_currency', currency);
  },

  addCurrency: (amount) => {
    set(state => {
      const currency = state.currency + amount;
      prefs.setInt('common_currency', currency);
      return { currency };
    });
  },

  purchaseItem: (charId, itemIndex, hasSpecialCode) => {
    const { items, currency } = get();
    const itemDef = SHOP_ITEMS[itemIndex];
    if (!itemDef) return false;
    const charItems = items[charId];
    if (!charItems || charItems[itemIndex]?.isPurchased) return false;

    const actualCost = hasSpecialCode ? 0 : itemDef.cost;
    if (!hasSpecialCode && currency < actualCost) return false;

    set(state => {
      const newCurrency = hasSpecialCode ? state.currency : state.currency - actualCost;
      const charItems = [...(state.items[charId] || [])];
      charItems[itemIndex] = { ...charItems[itemIndex], isPurchased: true };
      const newItems = { ...state.items, [charId]: charItems };
      saveItems(charId, charItems);
      prefs.setInt('common_currency', newCurrency);
      return { items: newItems, currency: newCurrency };
    });
    return true;
  },

  equipItem: (charId, itemIndex) => {
    set(state => {
      const charItems = [...(state.items[charId] || [])].map((item, i) => ({
        ...item,
        isEquipped: i === itemIndex ? true : false,
      }));
      if (!charItems[itemIndex]?.isPurchased) return state;
      charItems[itemIndex] = { ...charItems[itemIndex], isEquipped: true };
      const newItems = { ...state.items, [charId]: charItems };
      saveItems(charId, charItems);
      return { items: newItems };
    });
  },

  getEquippedIndex: (charId) => {
    const charItems = get().items[charId] || [];
    return charItems.findIndex(i => i.isEquipped);
  },

  getEquippedSprite: (charId) => {
    const charItems = get().items[charId] || [];
    const equippedIndex = charItems.findIndex(i => i.isEquipped);
    if (equippedIndex < 0) return null;
    return SHOP_ITEMS[equippedIndex]?.sprite || null;
  },

  checkCareerAutoPurchase: (charId, activeTiers, hasSpecialCode) => {
    const { items } = get();
    const charItems = [...(items[charId] || [])];
    let changed = false;

    SHOP_ITEMS.forEach((itemDef, i) => {
      if (!itemDef.autoPurchaseIfStatus || charItems[i]?.isPurchased) return;
      const hasRequired = itemDef.requiredStatus === 'None' || activeTiers[itemDef.requiredStatus as CareerTier] || hasSpecialCode;
      if (hasRequired) {
        charItems[i] = { ...charItems[i], isPurchased: true };
        changed = true;
      }
    });

    if (changed) {
      set(state => {
        const newItems = { ...state.items, [charId]: charItems };
        saveItems(charId, charItems);
        return { items: newItems };
      });
    }
  },
}));
