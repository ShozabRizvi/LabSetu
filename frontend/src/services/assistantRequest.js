function authenticationError(message) {
  return Object.assign(new Error(message), { code: 'UNAUTHENTICATED' });
}

function clearStoredTokens(apiClient, browser) {
  apiClient.setToken(null);
  for (const key of ['labsetu_patient_token', 'labsetu_authority_token']) {
    browser.sessionStorage.removeItem(key);
    browser.localStorage.removeItem(key);
  }
}

export function createAssistantRequest({ apiClient, supabase, fetchImpl = fetch, browser }) {
  return async function assistantRequest(path, { method = 'GET', body, binary = false, authRole } = {}) {
    const headers = apiClient.getHeaders();
    const publicRequest = path === '/public/chat';
    const demoRequest = browser.location.pathname === '/assistant-demo';
    let supabaseRequest = false;

    if (publicRequest || demoRequest) {
      delete headers.Authorization;
      if (demoRequest) {
        const token = browser.sessionStorage.getItem('labsetu_assistant_demo_token');
        if (token) headers.Authorization = `Bearer ${token}`;
      }
    } else {
      supabaseRequest = true;
      const { data, error } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (!token || error) {
        await supabase.auth.signOut({ scope: 'local' });
        clearStoredTokens(apiClient, browser);
        throw authenticationError(error
          ? 'Your session could not be refreshed. Sign in again to continue.'
          : 'Your session has expired. Sign in again to continue.');
      }

      const role = authRole || (browser.location.pathname.startsWith('/app') ? 'authority' : 'citizen');
      const sessionRole = ['authority', 'admin', 'staff'].includes(data.session.user?.app_metadata?.role) ? 'authority' : 'citizen';
      let displayed;
      try { displayed = JSON.parse(browser.sessionStorage.getItem(`labsetu_${role === 'citizen' ? 'patient' : 'authority'}_session`) || browser.localStorage.getItem(`labsetu_${role === 'citizen' ? 'patient' : 'authority'}_session`) || 'null'); } catch {}
      if (!data.session.user?.id || sessionRole !== role || (displayed && displayed.id !== data.session.user.id)) {
        throw authenticationError('The active account does not match this portal. Reopen the correct portal before continuing.');
      }
      const tokenKey = role === 'citizen' ? 'labsetu_patient_token' : 'labsetu_authority_token';
      browser.sessionStorage.setItem(tokenKey, token);
      browser.localStorage.setItem(tokenKey, token);
      apiClient.setToken(token);
      headers.Authorization = `Bearer ${token}`;
    }

    let response;
    try {
      response = await fetchImpl(`${apiClient.baseUrl}/assistant${path}`, {
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
    if (response.status === 401 && supabaseRequest) {
      await supabase.auth.signOut({ scope: 'local' });
      clearStoredTokens(apiClient, browser);
      throw authenticationError('Your session is invalid or expired. Sign in again to continue.');
    }
    if (!response.ok || payload?.success !== true) {
      throw new Error(payload?.error?.message || payload?.error || `Request failed (${response.status}).`);
    }
    return payload.data;
  };
}
