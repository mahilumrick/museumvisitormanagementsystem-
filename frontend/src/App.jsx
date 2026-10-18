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
  const logout = () => { clearAuth(); setAuthState(null); };

  return (
    <div className="shell">
      <header className="masthead topbar">
        <h1>Museum Visitor Management</h1>
        <div className="userbox">
          <span>{auth.username} ({auth.role})</span>
          <button className="tab" onClick={logout}>Logout</button>
        </div>
      </header>

      <div className="layout">
        <main>
          {tab === 'Dashboard' && isAdmin && <Dashboard {...shared} />}
          {tab === 'Visitors' && <Visitors {...shared} />}
          {tab === 'Waiting line' && <QueuePanel {...shared} />}
          {tab === 'Activity' && isAdmin && <ActivityLog {...shared} />}
        </main>

        <nav className="sidebar" role="tablist">
          {TABS.map((t) => (
            <button key={t} role="tab" aria-selected={tab === t}
              className={tab === t ? 'tab active' : 'tab'} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </nav>
      </div>

      {toast && <div className={`toast ${toast.kind}`} role="status">{toast.message}</div>}
    </div>
  );
}
