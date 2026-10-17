/**
 * LabSetu Diagnostic Report Service
 * 
 * Endpoints:
 * - GET    /api/reports          -> Get test reports (filter by uhid, labId, date)
 * - GET    /api/reports/:id      -> Get single report with test parameters & values
 * - POST   /api/reports          -> Generate/publish a new diagnostic report
 * - GET    /api/reports/:id/pdf  -> Download PDF report stream / URL
 */

import apiClient from './apiClient';
import { demoCitizenReports } from '../data/mockLabData';

const STORAGE_KEY = 'labsetu-demo:citizen_reports';

const getLocalReports = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : (demoCitizenReports || []);
  } catch {
    return demoCitizenReports || [];
  }
};

export const reportService = {
  /**
   * Fetch all reports
   */
  async getReports(queryParams = {}) {
    const fallbackFn = async () => {
      let reports = getLocalReports();
      if (queryParams.uhid) {
        reports = reports.filter(r => r.uhid === queryParams.uhid);
      }
      if (queryParams.status) {
        reports = reports.filter(r => r.status?.toLowerCase() === queryParams.status.toLowerCase());
      }
      return { success: true, data: reports };
    };

    const queryString = new URLSearchParams(queryParams).toString();
    const endpoint = `/reports${queryString ? `?${queryString}` : ''}`;
    return await apiClient.get(endpoint, {}, fallbackFn);
  },

  /**
   * Get report by ID
   */
  async getReportById(id) {
    const fallbackFn = async () => {
      const reports = getLocalReports();
      const report = reports.find(r => String(r.id) === String(id));
      if (!report) return { success: false, error: 'Report not found' };
      return { success: true, data: report };
    };

    return await apiClient.get(`/reports/${id}`, {}, fallbackFn);
  },

  /**
   * Create or publish a new report
   */
  async createReport(reportData) {
    const fallbackFn = async () => {
      const reports = getLocalReports();
      const newReport = {
        id: `REP-${Date.now().toString().slice(-6)}`,
        date: new Date().toLocaleDateString('en-GB'),
        status: 'Available',
        ...reportData
      };
      reports.unshift(newReport);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
      } catch (err) {
        console.error('Failed to save report', err);
      }
      return { success: true, data: newReport };
    };

    return await apiClient.post('/reports', reportData, {}, fallbackFn);
  },

  /**
   * Get PDF download URL or stream
   */
  async getReportPdfUrl(id) {
    return `${apiClient.baseUrl}/reports/${id}/pdf`;
  }
};

export default reportService;
