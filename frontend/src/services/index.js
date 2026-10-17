/**
 * LabSetu Services Central Export
 * 
 * Provides unified access to all backend API services:
 * - apiClient: Base HTTP client with JWT interceptors
 * - authService: User authentication, registration, session
 * - appointmentService: Booking, rescheduling, status management
 * - reportService: Diagnostic test reports & PDF download
 * - labService: Authority dashboard stats, transactions, activities
 * - billingService: Invoicing, bills, and outstanding dues
 */

export { apiClient } from './apiClient';
export { authService } from './authService';
export { appointmentService } from './appointmentService';
export { reportService } from './reportService';
export { labService } from './labService';
export { billingService } from './billingService';

export default {
  apiClient,
  authService,
  appointmentService,
  reportService,
  labService,
  billingService
};
