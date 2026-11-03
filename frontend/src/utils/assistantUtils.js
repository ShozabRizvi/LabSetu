export function money(paise, currency = 'INR') {
  if (!Number.isSafeInteger(paise)) return 'Price unavailable';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(paise / 100);
}

export function statusLabel(status) {
  return typeof status === 'string' ? status.replaceAll('_', ' ') : 'Not available';
}

export function rows(data, key) {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.[key]) ? data[key] : [];
}

export function paymentLink(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'rzp.io' && !url.port && !url.username && !url.password && url.pathname !== '/' ? url.href : null;
  } catch { return null; }
}

export function validatePrescription(file) {
  if (!file) return 'Choose a prescription to upload.';
  if (!['application/pdf', 'image/png', 'image/jpeg'].includes(file.type)) return 'Please choose a PDF, PNG or JPEG prescription.';
  if (file.size === 0 || file.size > 5 * 1024 * 1024) return 'The prescription must be between 1 byte and 5 MB.';
  return null;
}

export const sampleNext = { awaiting_collection: 'collected', collected: 'processing', processing: 'processing_complete' };
export const reportNext = { awaiting_results: 'draft', draft: 'pending_verification', pending_verification: 'approved', approved: 'released' };
export const tokenNext = { registered: 'called', called: 'completed' };
