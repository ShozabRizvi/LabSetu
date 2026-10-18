/**
 * LabSetu Authentication Service
 * 
 * Endpoints:
 * - POST /api/auth/login        -> Login with email, phone, or name
 * - POST /api/auth/register     -> Register new citizen or authority user
 * - GET  /api/auth/me           -> Get current authenticated user session
 * - POST /api/auth/logout       -> Invalidate session / token
 * - POST /api/auth/reset-password -> Reset forgotten password
 */

import apiClient from './apiClient';

const DEFAULT_USERS = [
  {
    email: 'admin@labsetu.com',
    password: 'password123',
    name: 'Dr. Shozab Rizvi',
    role: 'authority',
    phone: '9876543210',
    centerName: 'LabSetu Diagnostics',
    labId: '61326885'
  },
  {
    email: 'patient@labsetu.com',
    password: 'password123',
    name: 'Shozab Rizvi',
    role: 'citizen',
    phone: '9876501234',
    uhid: 'UHID-2026-8901',
    age: 28,
    gender: 'Male',
    bloodGroup: 'B+'
  }
];

const getLocalUsers = () => {
  try {
    const raw = localStorage.getItem('labsetu_users');
    return raw ? JSON.parse(raw) : DEFAULT_USERS;
  } catch {
    return DEFAULT_USERS;
  }
};

export const authService = {
  /**
   * Log in user by email, phone, or name
   * @param {string} identifier - Email, 10-digit phone number, patient name, or organisation name
   * @param {string} password - User password
   * @param {'citizen' | 'authority'} role - Intended role
   */
  async login(identifier, password, role) {
    const fallbackFn = async () => {
      const users = getLocalUsers();
      const cleanInput = identifier.trim().toLowerCase();
      const isPhoneInput = /^\d{10}$/.test(cleanInput.replace(/\D/g, ''));

      let existing = null;
      if (isPhoneInput) {
        existing = users.find(u => u.phone === cleanInput.replace(/\D/g, ''));
      } else {
        existing = users.find(u => u.email.toLowerCase() === cleanInput) ||
                   users.find(u => u.name && u.name.toLowerCase() === cleanInput) ||
                   users.find(u => u.centerName && u.centerName.toLowerCase() === cleanInput);
      }

      if (!existing) {
        return { success: false, error: 'No account found with these credentials. Please sign up first.' };
      }

      if (existing.password !== password) {
        return { success: false, error: 'Incorrect password. Please try again.' };
      }

      if (existing.role !== role) {
        return {
          success: false,
          error: `This account is registered as ${existing.role === 'authority' ? 'Authority / Staff' : 'Patient / Citizen'}. Please select the correct role tab.`
        };
      }

      const user = {
        email: existing.email,
        name: existing.name,
        role: existing.role,
        phone: existing.phone || '',
        uhid: existing.uhid || (existing.role === 'citizen' ? 'UHID-2026-8901' : undefined),
        labId: existing.labId || '61326885',
        centerName: existing.centerName || 'LabSetu Diagnostics',
        dob: existing.dob || '',
        gender: existing.gender || '',
        address: existing.address || '',
        designation: existing.designation || ''
      };

      const mockToken = `mock-jwt-token-${Date.now()}`;
      apiClient.setToken(mockToken);

      return {
        success: true,
        user,
        token: mockToken
      };
    };

    const res = await apiClient.post('/auth/login', { identifier, password, role }, {}, fallbackFn);

    if (res.success) {
      const token = res.data?.token || res.token;
      if (token) apiClient.setToken(token);
      return {
        success: true,
        user: res.data?.user || res.user || res.data,
        token
      };
    }

    return {
      success: false,
      error: res.error || 'Authentication failed'
    };
  },

  /**
   * Register a new user
   */
  async register(userData) {
    const fallbackFn = async () => {
      const users = getLocalUsers();
      const cleanEmail = userData.email.trim().toLowerCase();
      const cleanPhone = (userData.phone || '').replace(/\D/g, '');

      if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
        return { success: false, error: 'An account with this email already exists. Please sign in.' };
      }
      if (cleanPhone && users.some(u => u.phone === cleanPhone)) {
        return { success: false, error: 'An account with this phone number already exists. Please sign in.' };
      }

      const newUser = {
        email: cleanEmail,
        password: userData.password,
        name: userData.name.trim(),
        role: userData.role,
        phone: cleanPhone,
        dob: userData.dob || '',
        gender: userData.gender || '',
        address: userData.address || '',
        designation: userData.designation || '',
        uhid: userData.role === 'citizen' ? `UHID-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
        labId: userData.role === 'authority' ? `${Math.floor(10000000 + Math.random() * 90000000)}` : undefined,
        centerName: userData.centerName || ''
      };

      users.push(newUser);
      localStorage.setItem('labsetu_users', JSON.stringify(users));

      return { success: true, user: newUser };
    };

    const res = await apiClient.post('/auth/register', userData, {}, fallbackFn);
    if (res.success) {
      return { success: true, user: res.data?.user || res.user || res.data };
    }
    return { success: false, error: res.error || 'Registration failed' };
  },

  /**
   * Get current authenticated user profile
   */
  async getCurrentUser() {
    const fallbackFn = async () => {
      try {
        const saved = sessionStorage.getItem('labsetu_auth');
        return saved ? { success: true, user: JSON.parse(saved) } : { success: false, user: null };
      } catch {
        return { success: false, user: null };
      }
    };

    const res = await apiClient.get('/auth/me', {}, fallbackFn);
    if (res.success) {
      return { success: true, user: res.data?.user || res.user || res.data };
    }
    return { success: false, error: res.error };
  },

  /**
   * Logout user and clear tokens
   */
  async logout() {
    try {
      await apiClient.post('/auth/logout', {}, {}, async () => ({ success: true }));
    } catch {
      // Ignore network errors on logout
    } finally {
      apiClient.setToken(null);
    }
    return { success: true };
  },

  /**
   * Reset password
   */
  async resetPassword(email, newPassword) {
    const fallbackFn = async () => {
      const users = getLocalUsers();
      const cleanEmail = email.trim().toLowerCase();
      const idx = users.findIndex(u => u.email.toLowerCase() === cleanEmail);
      if (idx !== -1) {
        users[idx].password = newPassword;
        localStorage.setItem('labsetu_users', JSON.stringify(users));
      }
      return { success: true, message: 'Password updated successfully' };
    };

    const res = await apiClient.post('/auth/reset-password', { email, newPassword }, {}, fallbackFn);
    return res.success ? { success: true, message: res.data?.message || 'Password updated' } : { success: false, error: res.error };
  }
};

export default authService;
