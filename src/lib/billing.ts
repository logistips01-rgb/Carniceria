const TRIAL_MONTHS = 3;

export const SUBSCRIPTION_PRICE_LABEL = "9,99 €/mes";
export const BIZUM_PHONE = "613009788";

export function trialEndsAt(createdAt: Date): Date {
  const end = new Date(createdAt);
  end.setMonth(end.getMonth() + TRIAL_MONTHS);
  return end;
}

export function isShopAccountActive(shop: { createdAt: Date; subscriptionActive: boolean }): boolean {
  if (shop.subscriptionActive) return true;
  return new Date() < trialEndsAt(shop.createdAt);
}
