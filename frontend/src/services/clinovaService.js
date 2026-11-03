// Clinova has no transactional tool endpoint or patient-record permissions.
export async function requestClinova(baseUrl, body, fetchImpl = fetch) {
  let response;
  try {
    response = await fetchImpl(`${baseUrl}/clinova/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(45000),
    });
  } catch (error) {
    throw new Error(error.name === 'TimeoutError'
      ? 'Clinova timed out. Please try again.'
      : 'Clinova cannot reach the backend. Please check the server connection.');
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success !== true || !payload.data?.reply) {
    throw new Error(payload?.error?.message || payload?.error || `Clinova is unavailable (${response.status}).`);
  }
  return payload.data;
}
