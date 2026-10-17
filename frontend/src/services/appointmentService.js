/**
 * LabSetu Appointment Service
 * 
 * Endpoints:
 * - GET    /api/appointments       -> List all appointments (filterable by patient/lab)
 * - POST   /api/appointments       -> Book a new appointment
 * - GET    /api/appointments/:id   -> Get appointment details
 * - PUT    /api/appointments/:id   -> Update status / reschedule
 * - DELETE /api/appointments/:id   -> Cancel appointment
 */

import apiClient from './apiClient';

const STORAGE_KEY = 'labsetu-demo:citizen_appointments';

const getLocalAppointments = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalAppointments = (appointments) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
  } catch (err) {
    console.error('Failed to save local appointments', err);
  }
};

export const appointmentService = {
  /**
   * Get all appointments
   * @param {Object} queryParams - Optional filters (e.g. { status: 'Confirmed', date: '2026-10-18' })
   */
  async getAppointments(queryParams = {}) {
    const fallbackFn = async () => {
      let appointments = getLocalAppointments();
      if (queryParams.status) {
        appointments = appointments.filter(a => a.status === queryParams.status);
      }
      return { success: true, data: appointments };
    };

    const queryString = new URLSearchParams(queryParams).toString();
    const endpoint = `/appointments${queryString ? `?${queryString}` : ''}`;
    return await apiClient.get(endpoint, {}, fallbackFn);
  },

  /**
   * Get appointment by ID
   */
  async getAppointmentById(id) {
    const fallbackFn = async () => {
      const appointments = getLocalAppointments();
      const appt = appointments.find(a => String(a.id) === String(id));
      if (!appt) return { success: false, error: 'Appointment not found' };
      return { success: true, data: appt };
    };

    return await apiClient.get(`/appointments/${id}`, {}, fallbackFn);
  },

  /**
   * Book a new appointment
   * @param {Object} appointmentData
   */
  async bookAppointment(appointmentData) {
    const fallbackFn = async () => {
      const appointments = getLocalAppointments();
      const newAppt = {
        id: `APT-${Date.now().toString().slice(-6)}`,
        bookingDate: new Date().toISOString(),
        status: 'Confirmed',
        ...appointmentData
      };
      appointments.unshift(newAppt);
      saveLocalAppointments(appointments);
      return { success: true, data: newAppt };
    };

    return await apiClient.post('/appointments', appointmentData, {}, fallbackFn);
  },

  /**
   * Update an existing appointment (reschedule, status change)
   */
  async updateAppointment(id, updateData) {
    const fallbackFn = async () => {
      const appointments = getLocalAppointments();
      const idx = appointments.findIndex(a => String(a.id) === String(id));
      if (idx === -1) return { success: false, error: 'Appointment not found' };

      appointments[idx] = { ...appointments[idx], ...updateData };
      saveLocalAppointments(appointments);
      return { success: true, data: appointments[idx] };
    };

    return await apiClient.put(`/appointments/${id}`, updateData, {}, fallbackFn);
  },

  /**
   * Cancel an appointment
   */
  async cancelAppointment(id) {
    const fallbackFn = async () => {
      const appointments = getLocalAppointments();
      const idx = appointments.findIndex(a => String(a.id) === String(id));
      if (idx === -1) return { success: false, error: 'Appointment not found' };

      appointments[idx].status = 'Cancelled';
      saveLocalAppointments(appointments);
      return { success: true, data: appointments[idx] };
    };

    return await apiClient.delete(`/appointments/${id}`, {}, fallbackFn);
  }
};

export default appointmentService;
