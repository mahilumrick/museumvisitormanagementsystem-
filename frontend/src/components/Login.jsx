import { useState } from 'react';
import { setAuth } from '../auth.js';

const BASE = import.meta.env.VITE_API_URL || '';

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    const res = await fetch(`${BASE}/api/auth/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setError(data.error || 'Failed');
    if (mode === 'register') { setMode('login'); return setError('Registered! Log in na.'); }
    const auth = { token: data.token, role: data.role, username };
    setAuth(auth);
    onLogin(auth);
  }

  return (
    <div className="shell">
      <form onSubmit={submit} className="login-box">
        <h1>Museum Visitor Management</h1>
        <h2>{mode === 'login' ? 'Log in' : 'Register'}</h2>
        <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p>{error}</p>}
        <button type="submit">{mode === 'login' ? 'Log in' : 'Register'}</button>
        <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Create user account' : 'Back to log in'}
        </button>
      </form>
    </div>
  );
      }
