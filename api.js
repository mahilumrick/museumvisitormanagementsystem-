const BASE = import.meta.env.VITE_API_URL || '';

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || 'Request failed.');
    err.details = data.details;
    throw err;
  }
  return data;
}

const clean = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== '' && v != null));

export const api = {
  listVisitors: (params) => request(`/visitors?${new URLSearchParams(clean(params))}`),
  getByTicket: (code) => request(`/visitors/ticket/${encodeURIComponent(code)}`),
  createVisitor: (body) => request('/visitors', { method: 'POST', body }),
  updateVisitor: (id, body) => request(`/visitors/${id}`, { method: 'PUT', body }),
  deleteVisitor: (id) => request(`/visitors/${id}`, { method: 'DELETE' }),
  undoDelete: () => request('/visitors/undo', { method: 'POST' }),
  enqueue: (id) => request(`/queue/${id}`, { method: 'POST' }),
  callNext: () => request('/queue/next', { method: 'POST' }),
  checkout: (id) => request(`/visitors/${id}/checkout`, { method: 'POST' }),
  getQueue: () => request('/queue'),
  getStats: () => request('/stats'),
  getLogs: () => request('/logs'),
};
