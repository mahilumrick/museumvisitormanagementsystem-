import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function ActivityLog({ notify, version }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    api.getLogs().then(setLogs).catch((e) => notify(e.message, 'err'));
  }, [version, notify]);

  return (
    <section className="panel">
      <h2>Recent activity</h2>
      {logs.length === 0 ? <p className="empty">No activity yet. Register a visitor to get started.</p> : (
        <ul className="list">
          {logs.map((l) => (
            <li key={l.id}>
              <span><span className="pill">{l.action}</span> {l.visitor_name} <small className="mono">{l.ticket_code}</small></span>
              <small>{new Date(l.created_at).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
