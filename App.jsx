import { useState, useCallback } from 'react';
import Dashboard from './components/Dashboard.jsx';
import Visitors from './components/Visitors.jsx';
import QueuePanel from './components/QueuePanel.jsx';
import ActivityLog from './components/ActivityLog.jsx';

const TABS = ['Dashboard', 'Visitors', 'Waiting line', 'Activity'];

export default function App() {
  const [tab, setTab] = useState('Visitors');
  const [toast, setToast] = useState(null);
  const [version, setVersion] = useState(0); // bump to refresh other tabs

  const notify = useCallback((message, kind = 'ok') => {
    setToast({ message, kind });
    setTimeout(() => setToast(null), 3200);
  }, []);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const shared = { notify, refresh, version };

  return (
    <div className="shell">
      <header className="masthead">
        <h1>Museum Visitor Management</h1>
        <nav className="tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t} role="tab" aria-selected={tab === t}
              className={tab === t ? 'tab active' : 'tab'} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {tab === 'Dashboard' && <Dashboard {...shared} />}
        {tab === 'Visitors' && <Visitors {...shared} />}
        {tab === 'Waiting line' && <QueuePanel {...shared} />}
        {tab === 'Activity' && <ActivityLog {...shared} />}
      </main>

      {toast && <div className={`toast ${toast.kind}`} role="status">{toast.message}</div>}
    </div>
  );
}
