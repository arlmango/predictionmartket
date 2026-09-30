export function parseAmount(value) {
  if (!/^\d+(\.\d{1,6})?$/.test(value)) throw new Error('Введите положительную сумму с точностью до 6 знаков.');
  const raw = Math.round(Number(value) * 1e6);
  if (!Number.isSafeInteger(raw) || raw <= 0 || raw > 100e6) throw new Error('Сумма сделки: от 0,000001 до 100 mUSDC.');
  return raw;
}
