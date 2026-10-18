/**
 * LabSetu Billing & Invoice Service
 * 
 * Endpoints:
 * - GET    /api/billing        -> List bills/invoices
 * - POST   /api/billing        -> Create new patient bill
 * - GET    /api/billing/dues   -> List outstanding / pending dues
 * - GET    /api/billing/:id    -> Get invoice details
 */

import apiClient from './apiClient';
import { demoCitizenBills } from '../data/mockLabData';

const STORAGE_KEY = 'labsetu-demo:citizen_bills';

const getLocalBills = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : (demoCitizenBills || []);
  } catch {
    return demoCitizenBills || [];
  }
};

export const billingService = {
  /**
   * Get bills
   */
  async getBills(queryParams = {}) {
    const fallbackFn = async () => {
      let bills = getLocalBills();
      if (queryParams.status) {
        bills = bills.filter(b => b.status?.toLowerCase() === queryParams.status.toLowerCase());
      }
      return { success: true, data: bills };
    };

    const qs = new URLSearchParams(queryParams).toString();
    return await apiClient.get(`/billing${qs ? `?${qs}` : ''}`, {}, fallbackFn);
  },

  /**
   * Create new bill
   */
  async createBill(billData) {
    const fallbackFn = async () => {
      const bills = getLocalBills();
      const newBill = {
        id: `INV-${Date.now().toString().slice(-6)}`,
        date: new Date().toLocaleDateString('en-GB'),
        status: billData.dueAmount > 0 ? 'Pending' : 'Paid',
        ...billData
      };
      bills.unshift(newBill);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(bills));
      } catch (err) {
        console.error('Failed to save bill', err);
      }
      return { success: true, data: newBill };
    };

    return await apiClient.post('/billing', billData, {}, fallbackFn);
  },

  /**
   * Get pending dues
   */
  async getDueReports() {
    const fallbackFn = async () => {
      const bills = getLocalBills();
      const dueBills = bills.filter(b => b.status?.toLowerCase() !== 'paid');
      return { success: true, data: dueBills };
    };

    return await apiClient.get('/billing/dues', {}, fallbackFn);
  }
};

export default billingService;
