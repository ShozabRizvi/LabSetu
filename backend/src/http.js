export function sendDatabaseUnavailable(res) {
  return res.status(503).json({
    success: false,
    error: 'Database integration is not configured.'
  });
}

export function parseIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000-')) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value ? null : value;
}

export function parseUuid(value) {
  if (typeof value !== 'string') return null;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

export function readAnalyticsFilters(query) {
  const from = query.from === undefined ? null : parseIsoDate(query.from);
  const to = query.to === undefined ? null : parseIsoDate(query.to);
  const caseId = query.caseId === undefined ? null : parseUuid(query.caseId);

  if ((query.from !== undefined && !from) || (query.to !== undefined && !to) || (query.caseId !== undefined && !caseId)) {
    return { error: 'Use ISO dates (YYYY-MM-DD) and a valid caseId.' };
  }
  if (from && to && from > to) return { error: 'from must be on or before to.' };

  return { value: { from, to, caseId } };
}
