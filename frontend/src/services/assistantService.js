import apiClient from './apiClient';
import { supabase } from '../lib/supabase';
import { createAssistantRequest } from './assistantRequest';

// Healthcare actions intentionally have no optimistic or mock-data fallback.
export const assistantRequest = createAssistantRequest({ apiClient, supabase, browser: window });

export const assistantService = {
  config: () => assistantRequest('/config'),
  publicChat: body => assistantRequest('/public/chat', { method: 'POST', body }),
  chat: body => assistantRequest('/chat', { method: 'POST', body, authRole: 'citizen' }),
  confirm: body => assistantRequest('/confirm', { method: 'POST', body }),
  conversation: id => assistantRequest(`/conversations/${encodeURIComponent(id)}`),
  tests: query => assistantRequest(`/tests?query=${encodeURIComponent(query || '')}`),
  slots: date => assistantRequest(`/slots?date=${encodeURIComponent(date)}`),
  appointments: () => assistantRequest('/appointments'),
  notifications: () => assistantRequest('/notifications'),
  booking: id => assistantRequest(`/bookings/${encodeURIComponent(id)}`),
  explanation: (id, language = 'en') => assistantRequest(`/bookings/${encodeURIComponent(id)}/explanation?language=${encodeURIComponent(language)}`),
  paymentStatus: id => assistantRequest(`/bookings/${encodeURIComponent(id)}/payment`),
  book: body => assistantRequest('/bookings', { method: 'POST', body }),
  upload: body => assistantRequest('/prescriptions', { method: 'POST', body }),
  cancel: id => assistantRequest(`/bookings/${encodeURIComponent(id)}/cancel`, { method: 'POST', body: { confirmed: true } }),
  order: (id, idempotencyKey) => assistantRequest('/payments/order', { method: 'POST', body: { bookingId: id, idempotencyKey, confirmed: true } }),
  verify: body => assistantRequest('/payments/verify', { method: 'POST', body }),
  simulate: (id, outcome) => assistantRequest(`/payments/${encodeURIComponent(id)}/simulate`, { method: 'POST', body: { confirmed: true, outcome } }),
  receipt: id => assistantRequest(`/bookings/${encodeURIComponent(id)}/receipt`),
  report: id => assistantRequest(`/bookings/${encodeURIComponent(id)}/report.pdf`, { binary: true }),
  staffBookings: () => assistantRequest('/staff/bookings'),
  staffCatalogue: () => assistantRequest('/staff/catalogue', { authRole: 'authority' }),
  publishTest: (id, body) => assistantRequest(`/staff/tests${id ? `/${encodeURIComponent(id)}` : ''}`, { method: id ? 'PUT' : 'POST', body, authRole: 'authority' }),
  publishSlot: (id, body) => assistantRequest(`/staff/slots${id ? `/${encodeURIComponent(id)}` : ''}`, { method: id ? 'PUT' : 'POST', body, authRole: 'authority' }),
  transition: (id, body) => assistantRequest(`/staff/bookings/${encodeURIComponent(id)}/transition`, { method: 'POST', body }),
};
