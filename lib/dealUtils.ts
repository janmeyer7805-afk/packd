import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

export function formatTimeLeft(expiresAt: string): string {
  const expires = new Date(expiresAt);
  const now = new Date();
  if (expires < now) return 'Abgelaufen';
  return formatDistanceToNow(expires, { locale: de, addSuffix: false });
}

export function getDiscountPercent(original: number, deal: number): number {
  if (!original || original === 0) return 0;
  return Math.round(((original - deal) / original) * 100);
}
