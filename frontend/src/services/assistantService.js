import apiClient from './apiClient';

// Healthcare actions intentionally have no optimistic or mock-data fallback.
export async function assistantRequest(path, { method = 'GET', body, binary = false, authRole } = {}) {
  let response;
  const headers = apiClient.getHeaders();
  if (authRole) {
    const tokenKey = authRole === 'citizen' ? 'labsetu_patient_token' : 'labsetu_authority_token';
    const token = sessionStorage.getItem(tokenKey) || localStorage.getItem(tokenKey);
    if (token) headers.Authorization = `Bearer ${token}`;
    else delete headers.Authorization;
  }
  if (path === '/public/chat') delete headers.Authorization;
  if (window.location.pathname === '/assistant-demo') {
    delete headers.Authorization;
    const token = sessionStorage.getItem('labsetu_assistant_demo_token');
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  try {
    response = await fetch(`${apiClient.baseUrl}/assistant${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(60000),
    });
  } catch (error) {
    throw new Error(error.name === 'TimeoutError'
      ? 'The request timed out. Refresh status before retrying an action.'
      : 'The LabSetu backend is unavailable. Please try again when the connection is restored.');
  }
  if (binary && response.ok) return response.blob();
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success !== true) {
    throw new Error(payload?.error?.message || payload?.error || `Request failed (${response.status}).`);
  }
  return payload.data;
}

export const assistantService = {
  config: () => assistantRequest('/config'),
  publicChat: body => assistantRequest('/public/chat', { method: 'POST', body }),
  chat: body => assistantRequest('/chat', { method: 'POST', body, authRole: 'citizen' }),
  confirm: body => assistantRequest('/confirm', { method: 'POST', body }),
  tests: query => assistantRequest(`/tests?query=${encodeURIComponent(query || '')}`),
  slots: date => assistantRequest(`/slots?date=${encodeURIComponent(date)}`),
  appointments: () => assistantRequest('/appointments'),
  booking: id => assistantRequest(`/bookings/${encodeURIComponent(id)}`),
  book: body => assistantRequest('/bookings', { method: 'POST', body }),
  upload: body => assistantRequest('/prescriptions', { method: 'POST', body }),
  cancel: id => assistantRequest(`/bookings/${encodeURIComponent(id)}/cancel`, { method: 'POST', body: { confirmed: true } }),
  order: (id, idempotencyKey) => assistantRequest('/payments/order', { method: 'POST', body: { bookingId: id, idempotencyKey, confirmed: true } }),
  verify: body => assistantRequest('/payments/verify', { method: 'POST', body }),
  simulate: (id, outcome) => assistantRequest(`/payments/${encodeURIComponent(id)}/simulate`, { method: 'POST', body: { confirmed: true, outcome } }),
  receipt: id => assistantRequest(`/bookings/${encodeURIComponent(id)}/receipt`),
  report: id => assistantRequest(`/bookings/${encodeURIComponent(id)}/report.pdf`, { binary: true }),
  staffBookings: () => assistantRequest('/staff/bookings'),
  transition: (id, body) => assistantRequest(`/staff/bookings/${encodeURIComponent(id)}/transition`, { method: 'POST', body }),
};
