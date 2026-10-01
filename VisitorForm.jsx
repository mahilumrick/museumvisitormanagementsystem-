import { useState } from 'react';

const TYPES = ['Regular', 'Student', 'Senior', 'PWD', 'VIP'];
const today = () => new Date().toISOString().slice(0, 10);

function validate(f, isEdit) {
  const e = {};
  const name = f.full_name.trim();
  if (!name) e.full_name = 'Full name is required.';
  else if (!/^[A-Za-zÀ-ÿñÑ][A-Za-zÀ-ÿñÑ .'-]{1,59}$/.test(name)) e.full_name = "Use 2-60 letters (spaces, . ' - allowed).";
  if (!f.email.trim()) e.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = 'Enter a valid email address.';
  const age = Number(f.age);
  if (!Number.isInteger(age) || age < 1 || age > 120) e.age = 'Age must be a whole number from 1 to 120.';
  const g = Number(f.group_size);
  if (!Number.isInteger(g) || g < 1 || g > 50) e.group_size = 'Group size must be 1 to 50.';
  if (!f.visit_date) e.visit_date = 'Pick a visit date.';
  else if (!isEdit && f.visit_date < today()) e.visit_date = 'Visit date cannot be in the past.';
  if (!e.age) {
    if (f.visitor_type === 'Senior' && age < 60) e.visitor_type = 'Senior visitors must be 60 or older.';
    if (f.visitor_type === 'Student' && age > 30) e.visitor_type = 'Student rate applies to age 30 and below.';
  }
  return e;
}

export default function VisitorForm({ initial, onSubmit, onCancel }) {
  const isEdit = Boolean(initial);
  const [f, setF] = useState(initial ?? {
    full_name: '', email: '', age: '', visitor_type: 'Regular', group_size: 1, visit_date: today(),
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(ev) {
    ev.preventDefault();
    const found = validate(f, isEdit);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      await onSubmit({ ...f, age: Number(f.age), group_size: Number(f.group_size) });
    } catch (err) {
      setErrors(err.details || { form: err.message });
    } finally {
      setBusy(false);
    }
  }

  const Field = ({ id, label, children }) => (
    <label className="field">
      <span>{label}</span>
      {children}
      {errors[id] && <em className="err">{errors[id]}</em>}
    </label>
  );

  return (
    <div className="modal-back" onClick={onCancel}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit} noValidate>
        <h2>{isEdit ? 'Edit visitor' : 'Register visitor'}</h2>
        {errors.form && <p className="err">{errors.form}</p>}

        <Field id="full_name" label="Full name">
          <input value={f.full_name} onChange={set('full_name')} autoFocus />
        </Field>
        <Field id="email" label="Email">
          <input type="email" value={f.email} onChange={set('email')} />
        </Field>
        <div className="two">
          <Field id="age" label="Age">
            <input type="number" min="1" max="120" value={f.age} onChange={set('age')} />
          </Field>
          <Field id="group_size" label="Group size">
            <input type="number" min="1" max="50" value={f.group_size} onChange={set('group_size')} />
          </Field>
        </div>
        <div className="two">
          <Field id="visitor_type" label="Visitor type">
            <select value={f.visitor_type} onChange={set('visitor_type')}>
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field id="visit_date" label="Visit date">
            <input type="date" value={f.visit_date} onChange={set('visit_date')} />
          </Field>
        </div>

        <div className="actions">
          <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
          <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save visitor'}</button>
        </div>
      </form>
    </div>
  );
}
