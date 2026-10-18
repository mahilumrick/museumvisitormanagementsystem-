export const getAuth = () => JSON.parse(localStorage.getItem('auth') || 'null');
export const setAuth = (a) => localStorage.setItem('auth', JSON.stringify(a));
export const clearAuth = () => localStorage.removeItem('auth');
export const authHeaders = () => {
  const a = getAuth();
  return a ? { Authorization: `Bearer ${a.token}` } : {};
};
