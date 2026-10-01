import { useEffect, useState } from 'react';
import { api } from '../api.js';

const TYPES = ['VIP', 'Senior', 'PWD', 'Student', 'Regular'];
const STATUSES = ['Registered', 'Queued', 'Checked-in', 'Checked-out'];

export default function Dashboard({ notify, version }) {
  const [s, setS] = useState(null);

  useEffect(() => {
    api.getStats().then(setS).catch((e) => notify(e.message, 'err'));
  }, [version, notify]);

  if (!s) return <p className="muted">Loading…</p>;
  const max = Math.max(1, ...Object.values(s.byType));

  return (
    <section>
      <div className="stat-row">
        <Stat label="Registered visitors" value={s.totalVisitors} />
        <Stat label="People inside now" value={s.peopleInside} />
        <Stat label="Waiting in line" value={s.waiting} />
        <Stat label="Deletes you can undo" value={s.undoAvailable} />
      </div>

      <div className="split">
        <div className="panel">
          <h2>Visitors by type</h2>
          {TYPES.map((t) => (
            <div className="bar-row" key={t}>
              <span>{t}</span>
              <div className="bar"><i style={{ width: `${((s.byType[t] || 0) / max) * 100}%` }} /></div>
              <b>{s.byType[t] || 0}</b>
            </div>
          ))}
        </div>
        <div className="panel">
          <h2>Visitors by status</h2>
          {STATUSES.map((t) => (
            <div className="bar-row" key={t}>
              <span>{t}</span>
              <div className="bar alt"><i style={{ width: `${((s.byStatus[t] || 0) / Math.max(1, s.totalVisitors)) * 100}%` }} /></div>
              <b>{s.byStatus[t] || 0}</b>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const Stat = ({ label, value }) => (
  <div className="stat"><b>{value}</b><span>{label}</span></div>
);
