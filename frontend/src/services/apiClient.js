/**
 * LabSetu Centralized API Client
 * 
 * Configured to communicate with any standard REST backend (Node.js, Express,
 * Python FastAPI/Django, Go, Spring Boot, etc.).
 * 
 * Features:
 * - Automatic Authorization Bearer token header injection
 * - Configurable Base URL via VITE_API_BASE_URL (.env)
 * - Standardized error handling and JSON serialization
 * - Graceful fallback to local mock data if backend server is not running
 */

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/+$/, '');
const FORCE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const ENABLE_LOGS = import.meta.env.VITE_ENABLE_API_LOGS === 'true';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.isBackendAvailable = null; // null: unknown, true: online, false: offline
  }

  /**
   * Returns current JWT token from sessionStorage or localStorage
   */
  getToken() {
    return sessionStorage.getItem('labsetu_token') || localStorage.getItem('labsetu_token') || null;
  }

  /**
   * Sets the JWT token in sessionStorage and localStorage
   */
  setToken(token) {
    if (token) {
      sessionStorage.setItem('labsetu_token', token);
      localStorage.setItem('labsetu_token', token);
    } else {
      sessionStorage.removeItem('labsetu_token');
      localStorage.removeItem('labsetu_token');
    }
  }

  /**
   * Builds full headers including Bearer auth token if present
   */
  getHeaders(customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...customHeaders
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Centralized HTTP request runner with transparent fallback
   */
  async request(endpoint, options = {}, fallbackFn = null) {
    if (FORCE_MOCK && fallbackFn) {
      if (ENABLE_LOGS) console.log(`[API Mock] ${options.method || 'GET'} ${endpoint}`);
      return await fallbackFn();
    }

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const method = options.method || 'GET';

    const config = {
      method,
      headers: this.getHeaders(options.headers),
      ...options
    };

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    if (ENABLE_LOGS) {
      console.log(`[API Request] ${method} ${url}`, options.body || '');
    }

    try {
      const response = await fetch(url, config);

      // Handle 401 Unauthorized globally
      if (response.status === 401) {
        this.setToken(null);
        // Optional: emit unauthorized event or trigger redirect if needed
      }

      const contentType = response.headers.get('content-type') || '';
      let data = null;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (ENABLE_LOGS) {
        console.log(`[API Response ${response.status}] ${method} ${url}:`, data);
      }

      if (!response.ok) {
        const errorMessage = (data && (data.error || data.message)) || `Request failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      this.isBackendAvailable = true;
      return { success: true, data, status: response.status };
    } catch (err) {
      if (ENABLE_LOGS) {
        console.warn(`[API Network/Server Error] ${method} ${url}:`, err.message);
      }

      // If backend is unreachable (Failed to fetch / Connection refused) and fallback exists, use fallback
      if (fallbackFn) {
        if (ENABLE_LOGS) {
          console.info(`[API Fallback] Falling back to local data handler for ${endpoint}`);
        }
        this.isBackendAvailable = false;
        return await fallbackFn();
      }

      return {
        success: false,
        error: err.message || 'Unable to connect to backend server. Please verify your connection or .env settings.',
        status: 0
      };
    }
  }

  // Convenience methods
  get(endpoint, options = {}, fallbackFn = null) {
    return this.request(endpoint, { ...options, method: 'GET' }, fallbackFn);
  }

  post(endpoint, body, options = {}, fallbackFn = null) {
    return this.request(endpoint, { ...options, method: 'POST', body }, fallbackFn);
  }

  put(endpoint, body, options = {}, fallbackFn = null) {
    return this.request(endpoint, { ...options, method: 'PUT', body }, fallbackFn);
  }

  patch(endpoint, body, options = {}, fallbackFn = null) {
    return this.request(endpoint, { ...options, method: 'PATCH', body }, fallbackFn);
  }

  delete(endpoint, options = {}, fallbackFn = null) {
    return this.request(endpoint, { ...options, method: 'DELETE' }, fallbackFn);
  }
}

export const apiClient = new ApiClient();
export default apiClient;
