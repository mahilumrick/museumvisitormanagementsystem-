import { useState } from 'react';
import { setAuth } from '../auth.js';

const BASE = import.meta.env.VITE_API_URL || '';

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [msg, setMsg] = useState({ text: '', ok: false });
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setMsg({ text: '', ok: false });
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setMsg({ text: data.error || 'Failed. Try again.', ok: false });
      if (mode === 'register') {
        setMode('login');
        setPassword('');
        return setMsg({ text: 'Account created! You can log in now.', ok: true });
      }
      const auth = { token: data.token, role: data.role, username };
      setAuth(auth);
      onLogin(auth);
    } catch {
      setMsg({ text: 'Cannot reach the server.', ok: false });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form onSubmit={submit} className="auth-card">
        <h1 className="auth-title">Museum Visitor Management</h1>
        <p className="auth-sub">{mode === 'login' ? 'Log in to continue' : 'Create a user account'}</p>

        <label className="auth-label">Username</label>
        <input className="auth-input" value={username} autoComplete="username"
          onChange={(e) => setUsername(e.target.value)} required />

        <label className="auth-label">Password</label>
        <div className="auth-pw">
          <input className="auth-input" type={showPw ? 'text' : 'password'} value={password}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            onChange={(e) => setPassword(e.target.value)} required />
          <button type="button" className="auth-eye" onClick={() => setShowPw(!showPw)}>
            {showPw ? 'Hide' : 'Show'}
          </button>
        </div>

        {msg.text && <p className={msg.ok ? 'auth-msg ok' : 'auth-msg err'}>{msg.text}</p>}

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Register'}
        </button>
        <button type="button" className="auth-link"
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMsg({ text: '', ok: false }); }}>
          {mode === 'login' ? "Don't have an account? Register" : 'Back to log in'}
        </button>
      </form>
    </div>
  );
}
