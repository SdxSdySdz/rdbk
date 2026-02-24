export type StatusType =
  | 'None'
  | 'Junior'
  | 'Handyman'
  | 'PoliceOfficer'
  | 'Nurse'
  | 'Doctor'
  | 'Manager'
  | 'President';

export interface ShopItemDef {
  id: number;
  sprite: string;
  cost: number;
  autoPurchaseIfStatus: boolean;
  requiredStatus: StatusType;
  name: string;
}

// Shop items - using the numbered sprites from shop/ directory
const makeItem = (
  id: number,
  cost: number,
  requiredStatus: StatusType = 'None',
  autoPurchase = false,
): ShopItemDef => ({
  id,
  sprite: `/assets/sprites/shop/${id}.png`,
  cost,
  autoPurchaseIfStatus: autoPurchase,
  requiredStatus,
  name: `Item ${id}`,
});

export const SHOP_ITEMS: ShopItemDef[] = [
  makeItem(1, 50),
  makeItem(2, 100),
  makeItem(3, 150),
  makeItem(4, 200, 'Junior', true),
  makeItem(5, 250, 'Handyman', true),
  makeItem(6, 300, 'PoliceOfficer', true),
  makeItem(7, 350, 'Nurse', true),
  makeItem(8, 400, 'Doctor', true),
  makeItem(9, 500, 'Manager', true),
  makeItem(10, 600, 'President', true),
  makeItem(11, 80),
  makeItem(12, 120),
  makeItem(13, 180),
  makeItem(14, 220),
  makeItem(15, 280),
  makeItem(16, 320),
  makeItem(17, 380),
  makeItem(18, 450),
  makeItem(19, 520),
  makeItem(20, 600),
];
