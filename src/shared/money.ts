// Never do any computation with these types.
// We store cents on sqlite's side, its type system is underpowered unfortunately.

export const centsToDecimal = (cents: number): number => cents / 100;

export const decimalToCents = (decimal: number): number => Math.round(decimal * 100);

export const formatMoney = (cents: number): string => {
  const decimal = centsToDecimal(cents);
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(decimal);
};

// Re-export datetime helpers for convenience
export { formatDate } from './datetime';
