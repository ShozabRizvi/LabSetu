/**
 * LabSetu Unified Diagnostic & Error Identification Logger
 * 
 * Standardizes domain-tagged error tracking across:
 * - [AUTH_STATE_ERROR] / [AUTH]: Supabase authentication, session hydration & token lifecycle
 * - [DB_QUERY_ERROR] / [DB]: Supabase REST API (PostgREST), non-2xx status codes (400, 404, 500)
 * - [UI_RUNTIME_ERROR] / [UI]: React rendering crashes, ReferenceErrors, HMR state corruption
 * - [NETWORK_API_ERROR] / [NETWORK]: Client fetch timeouts, CORS, offline connectivity
 * 
 * Enforces zero silent failures: all unhandled promise rejections and exceptions are tagged and logged.
 */

class DiagnosticLogger {
  constructor() {
    this.history = [];
    this.maxHistory = 100;
  }

  _record(domain, type, message, metadata = {}, stack = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      domain,
      type,
      message,
      metadata,
      stack: stack || (metadata?.error instanceof Error ? metadata.error.stack : (new Error().stack))
    };

    this.history.unshift(entry);
    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }
    return entry;
  }

  /**
   * Log authentication or credential exceptions
   * @param {string} message 
   * @param {object} metadata - email, role, session state, etc.
   */
  auth(message, metadata = {}) {
    const entry = this._record('AUTH', 'AUTH_STATE_ERROR', message, metadata);
    console.group(`%c[AUTH_STATE_ERROR] ${message}`, 'background: #fee2e2; color: #991b1b; font-weight: bold; padding: 2px 6px; border-radius: 4px;');
    console.error('Message:', message);
    if (Object.keys(metadata).length > 0) {
      console.info('Metadata Parameters:', metadata);
    }
    if (entry.stack) {
      console.debug('Stack Trace:', entry.stack);
    }
    console.groupEnd();
  }

  /**
   * Log Supabase REST API & PostgREST query errors (e.g. HTTP 400 Bad Request, 500 Server Error)
   * @param {object} details - url, status, method, headers, errorBody, duration
   */
  db(details = {}) {
    const { url, status, statusText, method = 'GET', error, headers, duration } = details;
    const msg = `${method} ${url} → HTTP ${status} ${statusText || ''}`.trim();
    const entry = this._record('DB', 'DB_QUERY_ERROR', msg, details);

    console.group(`%c[DB_QUERY_ERROR] ${msg}`, 'background: #fef3c7; color: #92400e; font-weight: bold; padding: 2px 6px; border-radius: 4px;');
    console.error(`Target Endpoint: ${url}`);
    console.error(`HTTP Status Code: ${status} (${statusText || 'Error'})`);
    console.error(`HTTP Method: ${method}`);
    if (duration) console.info(`Execution Time: ${duration}`);
    if (error) {
      console.error('Server Response Payload:', error);
    }
    if (headers && Object.keys(headers).length > 0) {
      console.info('Request Headers:', headers);
    }
    if (entry.stack) {
      console.debug('Caller Trace:', entry.stack);
    }
    console.groupEnd();
  }

  /**
   * Log React component rendering failures, ErrorBoundary catches, and HMR crashes
   * @param {Error} error 
   * @param {object} errorInfo - componentStack, componentName
   */
  ui(error, errorInfo = {}) {
    const errorMsg = error?.message || String(error);
    const entry = this._record('UI', 'UI_RUNTIME_ERROR', errorMsg, { errorInfo }, error?.stack);

    console.group(`%c[UI_RUNTIME_ERROR] ${error?.name || 'Runtime Error'}: ${errorMsg}`, 'background: #ede9fe; color: #5b21b6; font-weight: bold; padding: 2px 6px; border-radius: 4px;');
    console.error('Exception Name:', error?.name);
    console.error('Error Message:', errorMsg);
    if (errorInfo.componentStack) {
      console.error('React Component Hierarchy:\n' + errorInfo.componentStack);
    }
    if (error?.stack) {
      console.error('Stack Trace:\n' + error.stack);
    }
    console.groupEnd();
  }

  /**
   * Log general network or apiClient HTTP failures
   * @param {string} message 
   * @param {object} metadata 
   */
  network(message, metadata = {}) {
    const entry = this._record('NETWORK', 'NETWORK_API_ERROR', message, metadata);
    console.group(`%c[NETWORK_API_ERROR] ${message}`, 'background: #ffedd5; color: #9a3412; font-weight: bold; padding: 2px 6px; border-radius: 4px;');
    console.error('Network Error:', message);
    if (Object.keys(metadata).length > 0) {
      console.info('Request Metadata:', metadata);
    }
    console.groupEnd();
  }

  /**
   * Returns recent structured error logs for on-screen debuggers
   */
  getHistory() {
    return [...this.history];
  }
}

export const logger = new DiagnosticLogger();

// Initialize Global Unhandled Promise Rejection & Window Error Listeners
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const errorMsg = reason?.message || String(reason || 'Unhandled Promise Rejection');
    const stack = reason?.stack || null;

    // Domain inference based on error signature
    if (errorMsg.includes('auth') || errorMsg.includes('JWT') || errorMsg.includes('session')) {
      logger.auth(`Unhandled async rejection: ${errorMsg}`, { reason, stack });
    } else if (errorMsg.includes('supabase') || errorMsg.includes('rest/v1') || errorMsg.includes('PostgREST')) {
      logger.db({ url: 'async-supabase-call', status: 'UNHANDLED_REJECTION', error: errorMsg });
    } else if (reason instanceof ReferenceError || reason instanceof TypeError) {
      logger.ui(reason instanceof Error ? reason : new Error(errorMsg), { source: 'unhandledrejection' });
    } else {
      logger.network(`Unhandled async promise rejection: ${errorMsg}`, { reason, stack });
    }
  });

  window.addEventListener('error', (event) => {
    // Intercept uncaught script and asset load errors
    if (event.error) {
      logger.ui(event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    } else {
      logger.network(`Resource or script load error on ${event.target?.src || event.target?.href || 'unknown'}`, {
        type: event.type
      });
    }
  });
}

export default logger;
