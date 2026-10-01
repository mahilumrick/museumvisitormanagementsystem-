import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function QueuePanel({ notify, refresh, version }) {
  const [queue, setQueue] = useState({ priority: [], regular: [] });
  const [inside, setInside] = useState([]);
  const [code, setCode] = useState('');
  const [found, setFound] = useState(null);

  useEffect(() => {
    api.getQueue().then(setQueue).catch((e) => notify(e.message, 'err'));
    api.listVisitors({ status: 'Checked-in', sortBy: 'created_at', order: 'asc' })
      .then((r) => setInside(r.data)).catch(() => {});
  }, [version, notify]);

  async function callNext() {
    try {
      const v = await api.callNext();
      notify(`Now entering: ${v.full_name} (${v.visitor_type}, group of ${v.group_size})`);
      refresh();
    } catch (e) { notify(e.message, 'err'); }
  }

  async function lookup(ev) {
    ev.preventDefault();
    try { setFound(await api.getByTicket(code)); }
    catch (e) { setFound(null); notify(e.message, 'err'); }
  }

  return (
    <section>
      <div className="panel">
        <h2>Scan a ticket</h2>
        <form className="toolbar" onSubmit={lookup}>
          <input className="search" placeholder="MVM-XXXXXX" value={code} onChange={(e) => setCode(e.target.value)} />
          <button className="btn ghost">Look up</button>
        </form>
        {found && (
          <p>
            <b>{found.full_name}</b> · {found.visitor_type} · group of {found.group_size} ·{' '}
            <span className={`pill s-${found.status}`}>{found.status}</span>
          </p>
        )}
      </div>

      <div className="toolbar">
        <button className="btn primary" onClick={callNext}>Call next visitor</button>
        <span className="muted meta">VIP, Senior and PWD go first (Min-Heap). Everyone else follows first-come, first-served (Queue).</span>
      </div>

      <div className="split">
        <Lane title="Priority lane" list={queue.priority} empty="No priority visitors waiting." />
        <Lane title="Regular lane" list={queue.regular} empty="No regular visitors waiting." />
      </div>

      <div className="panel">
        <h2>Inside the museum ({inside.length})</h2>
        {inside.length === 0 ? <p className="muted">Nobody is checked in.</p> : (
          <ul className="list">
            {inside.map((v) => (
              <li key={v.id}>
                <span>{v.full_name} <small>group of {v.group_size}</small></span>
                <button className="link" onClick={async () => {
                  try { await api.checkout(v.id); notify(`${v.full_name} checked out.`); refresh(); }
                  catch (e) { notify(e.message, 'err'); }
                }}>Check out</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Lane({ title, list, empty }) {
  return (
    <div className="panel">
      <h2>{title} ({list.length})</h2>
      {list.length === 0 ? <p className="muted">{empty}</p> : (
        <ol className="list numbered">
          {list.map((v) => (
            <li key={v.id}>
              <span>{v.full_name} <small>{v.visitor_type} · group of {v.group_size}</small></span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
