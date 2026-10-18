import { useState } from 'react';
import { setAuth } from '../auth.js';

const BASE = import.meta.env.VITE_API_URL || '';

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [msg, setMsg] = useState({ text: '', ok: false });
  const [loading, setLoading] = useState(false);
  const isRegister = mode === 'register';

  function switchMode() {
    setMode(isRegister ? 'login' : 'register');
    setMsg({ text: '', ok: false });
    setPassword('');
    setConfirm('');
  }

  async function submit(e) {
    e.preventDefault();
    setMsg({ text: '', ok: false });
    if (isRegister) {
      if (password.length < 6) return setMsg({ text: 'Password must be at least 6 characters.', ok: false });
      if (password !== confirm) return setMsg({ text: 'Passwords do not match.', ok: false });
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isRegister
          ? { full_name: fullName, email, password }
          : { email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setMsg({ text: data.error || 'Failed. Try again.', ok: false });
      if (isRegister) {
        setMode('login');
        setPassword('');
        setConfirm('');
        return setMsg({ text: 'Account created! You can log in now.', ok: true });
      }
      const auth = { token: data.token, role: data.role, username: data.name };
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
        <p className="auth-sub">{isRegister ? 'Sign up to visit the museum' : 'Log in to continue'}</p>

        {isRegister && (
          <>
            <label className="auth-label">Full name</label>
            <input className="auth-input" value={fullName} autoComplete="name"
              onChange={(e) => setFullName(e.target.value)} required />
          </>
        )}

        <label className="auth-label">Email</label>
        <input className="auth-input" type="email" value={email} autoComplete="email"
          onChange={(e) => setEmail(e.target.value)} required />

        <label className="auth-label">Password</label>
        <div className="auth-pw">
          <input className="auth-input" type={showPw ? 'text' : 'password'} value={password}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            onChange={(e) => setPassword(e.target.value)} required />
          <button type="button" className="auth-eye" onClick={() => setShowPw(!showPw)}>
            {showPw ? 'Hide' : 'Show'}
          </button>
        </div>

        {isRegister && (
          <>
            <label className="auth-label">Confirm password</label>
            <input className="auth-input" type={showPw ? 'text' : 'password'} value={confirm}
              autoComplete="new-password" onChange={(e) => setConfirm(e.target.value)} required />
          </>
        )}

        {msg.text && <p className={msg.ok ? 'auth-msg ok' : 'auth-msg err'}>{msg.text}</p>}

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? 'Please wait...' : isRegister ? 'Sign up' : 'Log in'}
        </button>
        <button type="button" className="auth-link" onClick={switchMode}>
          {isRegister ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
        </button>
      </form>
    </div>
  );
          }
