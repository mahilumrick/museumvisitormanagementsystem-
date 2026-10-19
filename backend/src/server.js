import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { store } from './services/visitorStore.js';
import authRouter, { requireAuth, requireAdmin } from './routes/auth.js';

const app = express();
app.use(cors());
app.use(express.json());

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
const admin = [requireAuth, requireAdmin];

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// LOGIN / REGISTER (public)
app.use('/api/auth', authRouter);

// READ (any logged-in user)
app.get('/api/visitors', requireAuth, wrap(async (req, res) => res.json(store.list(req.query))));
app.get('/api/visitors/ticket/:code', requireAuth, wrap(async (req, res) => res.json(store.getByTicket(req.params.code))));
app.get('/api/queue', requireAuth, wrap(async (_req, res) => res.json(store.queueView())));

// REGISTER A VISITOR (any logged-in user)
app.post('/api/visitors', requireAuth, wrap(async (req, res) => res.status(201).json(await store.create(req.body))));

// MANAGE VISITORS (admin only)
app.post('/api/visitors/undo', ...admin, wrap(async (_req, res) => res.json(await store.undoDelete())));
app.put('/api/visitors/:id', ...admin, wrap(async (req, res) => res.json(await store.update(req.params.id, req.body))));
app.delete('/api/visitors/:id', ...admin, wrap(async (req, res) => res.json(await store.remove(req.params.id))));

// QUEUE CONTROL (admin only)
app.post('/api/queue/next', ...admin, wrap(async (_req, res) => res.json(await store.callNext())));
app.post('/api/queue/:id', ...admin, wrap(async (req, res) => res.json(await store.enqueue(req.params.id))));
app.post('/api/visitors/:id/checkout', ...admin, wrap(async (req, res) => res.json(await store.checkout(req.params.id))));

// DASHBOARD (admin only)
app.get('/api/stats', ...admin, wrap(async (_req, res) => res.json(store.stats())));
app.get('/api/logs', ...admin, wrap(async (_req, res) => res.json(store.getLogs())));

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
