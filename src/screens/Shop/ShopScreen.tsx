import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShopStore } from '../../stores/shopStore';
import { useCareerStore } from '../../stores/careerStore';
import type { CareerTier } from '../../stores/careerStore';
import { useReferralStore } from '../../stores/referralStore';
import { useGameStore } from '../../stores/gameStore';
import { useLocalization } from '../../hooks/useLocalization';
import { PET_CHAR_IDS } from '../../types/game';
import { SHOP_ITEMS } from '../../constants/shop';
import styles from './ShopScreen.module.css';

type ButtonVariant = 'white' | 'green' | 'blue' | 'gray';

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  white: styles.btn_white,
  green: styles.btn_green,
  blue: styles.btn_blue,
  gray: styles.btn_gray,
};

const ShopScreen: React.FC = () => {
  const navigate = useNavigate();
  const t = useLocalization();

  const currentPetIndex = useGameStore((s) => s.currentPetIndex);
  const setCurrentPet = useGameStore((s) => s.setCurrentPet);
  const charId = PET_CHAR_IDS[currentPetIndex] ?? 'bear';

  const shopItems = useShopStore((s) => s.items);
  const currency = useShopStore((s) => s.currency);
  const purchaseItem = useShopStore((s) => s.purchaseItem);
  const equipItem = useShopStore((s) => s.equipItem);
  const checkCareerAutoPurchase = useShopStore((s) => s.checkCareerAutoPurchase);

  const careers = useCareerStore((s) => s.careers);
  const career = careers[charId];

  const hasSpecialCode = useReferralStore((s) => s.hasSpecialCode);

  const charItems = shopItems[charId] ?? [];

  useEffect(() => {
    if (career) {
      checkCareerAutoPurchase(charId, career.activeTiers, hasSpecialCode);
    }
  }, [charId, career, hasSpecialCode, checkCareerAutoPurchase]);

  const getButtonConfig = (
    index: number
  ): { label: string; variant: ButtonVariant; action: () => void; disabled: boolean } => {
    const itemDef = SHOP_ITEMS[index];
    const itemState = charItems[index];

    if (!itemDef || !itemState) {
      return { label: '?', variant: 'gray', action: () => {}, disabled: true };
    }

    if (itemState.isEquipped) {
      return { label: 'EQUIPPED', variant: 'blue', action: () => {}, disabled: true };
    }

    if (itemState.isPurchased) {
      return {
        label: 'EQUIP',
        variant: 'green',
        action: () => equipItem(charId, index),
        disabled: false,
      };
    }

    // Check career requirement
    if (itemDef.requiredStatus !== 'None') {
      const hasRequired =
        career?.activeTiers[itemDef.requiredStatus as CareerTier] || hasSpecialCode;
      if (!hasRequired) {
        return {
          label: `Need ${itemDef.requiredStatus}`,
          variant: 'gray',
          action: () => {},
          disabled: true,
        };
      }
    }

    const canAfford = hasSpecialCode || currency >= itemDef.cost;
    const costLabel = hasSpecialCode ? 'FREE' : `BUY ${itemDef.cost}`;
    return {
      label: costLabel,
      variant: canAfford ? 'white' : 'gray',
      action: () => {
        if (canAfford) purchaseItem(charId, index, hasSpecialCode);
      },
      disabled: !canAfford,
    };
  };

  return (
    <div className={styles.root}>
      <div className={styles.layout}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/')}>
            ← Home
          </button>
          <h1 className={styles.title}>{t('shop') || 'Shop'}</h1>
          <div className={styles.currencyDisplay}>
            <span className={styles.currencyIcon}>💎</span>
            <span className={styles.currencyAmount}>{currency}</span>
          </div>
        </div>

        {/* Pet selector tabs */}
        <div className={styles.petTabs}>
          {PET_CHAR_IDS.map((id, i) => (
            <button
              key={id}
              className={`${styles.petTab} ${i === currentPetIndex ? styles.petTabActive : ''}`}
              onClick={() => setCurrentPet(i)}
            >
              {id}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className={styles.grid}>
          {SHOP_ITEMS.map((itemDef, index) => {
            const btnConfig = getButtonConfig(index);
            return (
              <div key={itemDef.id} className={styles.card}>
                <ShopItemImage src={itemDef.sprite} name={itemDef.name} />
                <span className={styles.itemName}>{itemDef.name}</span>
                {itemDef.requiredStatus !== 'None' && (
                  <span className={styles.itemReq}>{itemDef.requiredStatus}</span>
                )}
                <button
                  className={`${styles.itemBtn} ${VARIANT_CLASS[btnConfig.variant] ?? ''}`}
                  onClick={btnConfig.action}
                  disabled={btnConfig.disabled}
                >
                  {btnConfig.label}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const ShopItemImage: React.FC<{ src: string; name: string }> = ({ src, name }) => {
  const [err, setErr] = React.useState(false);
  if (err) {
    return (
      <div className={styles.itemImgFallback}>
        <span>🎁</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      className={styles.itemImg}
      onError={() => setErr(true)}
    />
  );
};

export default ShopScreen;
