import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { assistantRequest, assistantService } from '../services/assistantService';
import CitizenAssistant from './citizen/CitizenAssistant';
import AssistantWorkflow from './lab/AssistantWorkflow';
import './citizen/CitizenAssistant.css';

export default function AssistantDemo() {
  const [enabled, setEnabled] = useState(null);
  const [role, setRole] = useState('citizen');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { assistantService.config().then(config => setEnabled(config.demoAuth)).catch(e => setError(e.message)); }, []);

  async function login(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const session = await assistantRequest('/demo-session', { method: 'POST', body: { role, password } });
      // This route uses a dedicated session key and does not modify Supabase login state.
      sessionStorage.setItem('labsetu_assistant_demo_token', session.token);
      setUser(session.user); setPassword('');
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  function logout() {
    sessionStorage.removeItem('labsetu_assistant_demo_token'); setUser(null);
  }

  return <div className="assistant-demo-shell"><div className="assistant-demo-banner"><strong>LABSETU SYNTHETIC DEMONSTRATION</strong><Link to="/">Home</Link>{user && <><span>{user.name} · {user.role}</span><button onClick={logout}>Sign out / switch role</button></>}</div>
    {user ? (user.role === 'authority' ? <AssistantWorkflow /> : <CitizenAssistant />) : <main className="assistant-page"><section className="assistant-card assistant-demo-login"><h1>Assistant demo sign in</h1><p>Uses synthetic patient and laboratory identities. Enable DEMO_MODE and configure DEMO_PASSWORD on your local backend.</p>{error && <p className="assistant-error" role="alert">{error}</p>}{enabled === false ? <p>Demo authentication is disabled on this backend. Use your normal patient or staff account.</p> : <form onSubmit={login}><label className="assistant-field">Role<select value={role} onChange={e => setRole(e.target.value)}><option value="citizen">Synthetic patient</option><option value="authority">Synthetic laboratory staff</option></select></label><label className="assistant-field">Configured demo password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="off" /></label><button disabled={busy || enabled !== true}>{busy ? 'Signing in…' : 'Sign in to synthetic demo'}</button></form>}</section></main>}
  </div>;
}
