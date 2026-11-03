export function priceInPaise(value) {
  if (typeof value !== 'string' || !/^\d{1,8}(?:\.\d{1,2})?$/.test(value.trim())) throw new Error('Enter an approved INR price with at most two decimal places.');
  const [whole, fraction = ''] = value.trim().split('.');
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > 1_000_000_000) throw new Error('The approved price must be between INR 0.01 and INR 10,000,000.');
  return amount;
}

export function catalogueParameters(value) {
  if (!value.trim()) return [];
  return value.split('\n').filter(line => line.trim()).map(line => {
    const fields = line.split('|').map(field => field.trim());
    if (fields.length < 2 || fields.length > 3 || !fields[0]) throw new Error('Use Parameter name | Unit | Laboratory reference interval, one parameter per line.');
    return { name: fields[0], unit: fields[1], ...(fields[2] ? { referenceRange: fields[2] } : {}) };
  });
}
