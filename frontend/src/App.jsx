import { useState, useCallback } from 'react';
import Dashboard from './components/Dashboard.jsx';
import Visitors from './components/Visitors.jsx';
import QueuePanel from './components/QueuePanel.jsx';
import ActivityLog from './components/ActivityLog.jsx';
import Login from './components/Login.jsx';
import { getAuth, clearAuth } from './auth.js';

export default function App() {
  const [auth, setAuthState] = useState(getAuth());
  const [tab, setTab] = useState('Visitors');
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [version, setVersion] = useState(0);

  const notify = useCallback((message, kind = 'ok') => {
    setToast({ message, kind });
    setTimeout(() => setToast(null), 3200);
  }, []);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  if (!auth) return <Login onLogin={setAuthState} />;

  const isAdmin = auth.role === 'admin';
  const TABS = isAdmin
    ? ['Dashboard', 'Visitors', 'Waiting line', 'Activity']
    : ['Visitors', 'Waiting line'];

  const shared = { notify, refresh, version, isAdmin };
  const go = (t) => { setTab(t); setOpen(false); };
  const logout = () => { clearAuth(); setAuthState(null); };

  return (
    <div className={isAdmin ? 'shell' : 'shell is-user'}>
      <header className="masthead topbar">
        <button className="menu-btn" onClick={() => setOpen(!open)} aria-label="Menu">☰</button>
        <h1>Museum Visitor Management</h1>
      </header>

      {open && <div className="drawer-backdrop" onClick={() => setOpen(false)} />}
      <aside className={open ? 'drawer open' : 'drawer'}>
        <div className="drawer-user">
          <strong>{auth.username}</strong>
          <span>{auth.role}</span>
        </div>
        {TABS.map((t) => (
          <button key={t} className={tab === t ? 'drawer-item active' : 'drawer-item'} onClick={() => go(t)}>
            {t}
          </button>
        ))}
        <button className="drawer-logout" onClick={logout}>Logout</button>
      </aside>

      <main>
        {tab === 'Dashboard' && isAdmin && <Dashboard {...shared} />}
        {tab === 'Visitors' && <Visitors {...shared} />}
        {tab === 'Waiting line' && <QueuePanel {...shared} />}
        {tab === 'Activity' && isAdmin && <ActivityLog {...shared} />}
      </main>

      {toast && <div className={`toast ${toast.kind}`} role="status">{toast.message}</div>}
    </div>
  );
}
