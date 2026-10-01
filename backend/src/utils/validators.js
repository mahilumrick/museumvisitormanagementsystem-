import { ApiError } from './ApiError.js';

export const VISITOR_TYPES = ['Regular', 'Student', 'Senior', 'PWD', 'VIP'];

const NAME_RE = /^[A-Za-zÀ-ÿñÑ][A-Za-zÀ-ÿñÑ .'-]{1,59}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Validates visitor input. Throws ApiError(400) with per-field messages. */
export function validateVisitor(input, { allowPastDate = false } = {}) {
  const errors = {};
  const fullName = String(input.full_name ?? '').trim().replace(/\s+/g, ' ');
  const email = String(input.email ?? '').trim().toLowerCase();
  const age = Number(input.age);
  const groupSize = Number(input.group_size ?? 1);
  const type = input.visitor_type ?? 'Regular';
  const date = String(input.visit_date ?? '').trim();

  if (!fullName) errors.full_name = 'Full name is required.';
  else if (!NAME_RE.test(fullName)) errors.full_name = "Use 2-60 letters (spaces, . ' - allowed).";

  if (!email) errors.email = 'Email is required.';
  else if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.';

  if (!Number.isInteger(age) || age < 1 || age > 120) errors.age = 'Age must be a whole number from 1 to 120.';
  if (!Number.isInteger(groupSize) || groupSize < 1 || groupSize > 50) errors.group_size = 'Group size must be 1 to 50.';
  if (!VISITOR_TYPES.includes(type)) errors.visitor_type = `Type must be one of: ${VISITOR_TYPES.join(', ')}.`;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
    errors.visit_date = 'Visit date must be a valid date (YYYY-MM-DD).';
  } else if (!allowPastDate && date < new Date().toISOString().slice(0, 10)) {
    errors.visit_date = 'Visit date cannot be in the past.';
  }

  // Business rules
  if (!errors.age && !errors.visitor_type) {
    if (type === 'Senior' && age < 60) errors.visitor_type = 'Senior visitors must be 60 or older.';
    if (type === 'Student' && age > 30) errors.visitor_type = 'Student rate applies to age 30 and below.';
  }

  if (Object.keys(errors).length) throw new ApiError(400, 'Validation failed.', errors);

  return { full_name: fullName, email, age, group_size: groupSize, visitor_type: type, visit_date: date };
}
