import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { store } from './services/visitorStore.js';

const app = express();
app.use(cors());
app.use(express.json());

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// READ (search + sort + filter)
app.get('/api/visitors', wrap(async (req, res) => res.json(store.list(req.query))));
app.get('/api/visitors/ticket/:code', wrap(async (req, res) => res.json(store.getByTicket(req.params.code))));

// CREATE / UPDATE / DELETE / UNDO
app.post('/api/visitors', wrap(async (req, res) => res.status(201).json(await store.create(req.body))));
app.post('/api/visitors/undo', wrap(async (_req, res) => res.json(await store.undoDelete())));
app.put('/api/visitors/:id', wrap(async (req, res) => res.json(await store.update(req.params.id, req.body))));
app.delete('/api/visitors/:id', wrap(async (req, res) => res.json(await store.remove(req.params.id))));

// QUEUE
app.get('/api/queue', wrap(async (_req, res) => res.json(store.queueView())));
app.post('/api/queue/next', wrap(async (_req, res) => res.json(await store.callNext())));
app.post('/api/queue/:id', wrap(async (req, res) => res.json(await store.enqueue(req.params.id))));
app.post('/api/visitors/:id/checkout', wrap(async (req, res) => res.json(await store.checkout(req.params.id))));

// DASHBOARD
app.get('/api/stats', wrap(async (_req, res) => res.json(store.stats())));
app.get('/api/logs', wrap(async (_req, res) => res.json(store.getLogs())));

// Error handler
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ message: err.message || 'Server error.', details: err.details });
});

const PORT = process.env.PORT || 5000;
store.init()
  .then(() => app.listen(PORT, () => console.log(`Museum VMS API running on http://localhost:${PORT}`)))
  .catch((e) => { console.error('Failed to start:', e.message); process.exit(1); });
