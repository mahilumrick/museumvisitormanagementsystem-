import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  const full_name = String(req.body.full_name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const admin_code = String(req.body.admin_code || '');
  if (!full_name || !email || password.length < 6)
    return res.status(400).json({ error: 'Please complete all fields (password min 6).' });

  let role = 'user';
  if (admin_code) {
    if (!process.env.ADMIN_CODE || admin_code !== process.env.ADMIN_CODE)
      return res.status(403).json({ error: 'Invalid admin code.' });
    role = 'admin';
  }

  const { error } = await supabase.from('users').insert({
    full_name, email, password_hash: bcrypt.hashSync(password, 10), role,
  });
  if (error) return res.status(400).json({ error: 'Email is already registered.' });
  res.json({ ok: true });
});

router.post('/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const as = req.body.as === 'admin' ? 'admin' : 'user';
  const { data: u } = await supabase.from('users').select('*').eq('email', email).single();
  if (!u || !bcrypt.compareSync(String(req.body.password || ''), u.password_hash))
    return res.status(401).json({ error: 'Wrong email or password.' });
  if (as === 'admin' && u.role !== 'admin')
    return res.status(403).json({ error: 'This account is not an admin.' });
  if (as === 'user' && u.role === 'admin')
    return res.status(403).json({ error: 'Admin account: please use the Admin tab.' });
  const token = jwt.sign({ id: u.id, role: u.role, name: u.full_name }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, role: u.role, name: u.full_name });
});

export function requireAuth(req, res, next) {
  try {
    req.user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Login required' });
  }
}

export const requireAdmin = (req, res, next) =>
  req.user?.role === 'admin' ? next() : res.status(403).json({ error: 'Admin only' });

export default router;
