/**
 * LabSetu Lab & Operations Service
 * 
 * Endpoints:
 * - GET /api/lab/dashboard       -> Authority dashboard stats and summary
 * - GET /api/lab/transactions    -> Recent billing & payment transactions
 * - GET /api/lab/activities      -> Recent audit & system logs
 * - GET /api/labs/nearby         -> List nearby diagnostic centers
 * - GET /api/lab/center-details  -> Get diagnostic center details & settings
 * - PUT /api/lab/center-details  -> Update diagnostic center configuration
 */

import apiClient from './apiClient';
import { demoDashboardData, demoActivitiesData, demoNearbyLabs } from '../data/mockLabData';

export const labService = {
  /**
   * Get authority dashboard metrics and stats
   */
  async getDashboardData() {
    const fallbackFn = async () => {
      try {
        const saved = localStorage.getItem('labsetu-demo:dashboard');
        return { success: true, data: saved ? JSON.parse(saved) : demoDashboardData };
      } catch {
        return { success: true, data: demoDashboardData };
      }
    };

    return await apiClient.get('/lab/dashboard', {}, fallbackFn);
  },

  /**
   * Get recent transactions
   */
  async getTransactions(limit = 10) {
    const fallbackFn = async () => {
      try {
        const saved = localStorage.getItem('labsetu-demo:dashboard');
        const dash = saved ? JSON.parse(saved) : demoDashboardData;
        return { success: true, data: (dash.recentTransactions || []).slice(0, limit) };
      } catch {
        return { success: true, data: (demoDashboardData.recentTransactions || []).slice(0, limit) };
      }
    };

    return await apiClient.get(`/lab/transactions?limit=${limit}`, {}, fallbackFn);
  },

  /**
   * Get recent activities
   */
  async getActivities() {
    const fallbackFn = async () => {
      try {
        const saved = localStorage.getItem('labsetu-demo:labsetu_activities');
        return { success: true, data: saved ? JSON.parse(saved) : demoActivitiesData };
      } catch {
        return { success: true, data: demoActivitiesData };
      }
    };

    return await apiClient.get('/lab/activities', {}, fallbackFn);
  },

  /**
   * Get nearby diagnostic laboratories
   */
  async getNearbyLabs(params = {}) {
    const fallbackFn = async () => {
      try {
        const saved = localStorage.getItem('labsetu-demo:citizen_nearby_labs');
        return { success: true, data: saved ? JSON.parse(saved) : demoNearbyLabs };
      } catch {
        return { success: true, data: demoNearbyLabs };
      }
    };

    const qs = new URLSearchParams(params).toString();
    return await apiClient.get(`/labs/nearby${qs ? `?${qs}` : ''}`, {}, fallbackFn);
  },

  /**
   * Get center details
   */
  async getCenterDetails() {
    const fallbackFn = async () => {
      try {
        const saved = localStorage.getItem('labsetu-demo:setup_center_details');
        return {
          success: true,
          data: saved ? JSON.parse(saved) : {
            name: 'LabSetu Diagnostics',
            phone: '9876543210',
            email: 'admin@labsetu.com',
            address: '12, Healthcare Avenue, Medical Enclave',
            city: 'New Delhi',
            pincode: '110001',
            labId: '61326885'
          }
        };
      } catch {
        return {
          success: true,
          data: {
            name: 'LabSetu Diagnostics',
            labId: '61326885'
          }
        };
      }
    };

    return await apiClient.get('/lab/center-details', {}, fallbackFn);
  },

  /**
   * Update center details
   */
  async updateCenterDetails(details) {
    const fallbackFn = async () => {
      try {
        localStorage.setItem('labsetu-demo:setup_center_details', JSON.stringify(details));
      } catch (err) {
        console.error('Failed to save center details', err);
      }
      return { success: true, data: details };
    };

    return await apiClient.put('/lab/center-details', details, {}, fallbackFn);
  }
};

export default labService;
