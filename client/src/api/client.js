// All calls to the Express API live here, so components never build URLs.

// When any request is answered with "401 not signed in", the auth provider is told to show the login page.
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

async function request(path, { allow401 = false, body, ...init } = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    // fetch only throws when the server cannot be reached at all
    const error = new Error('Cannot reach the server. Check your internet connection and try again.');
    error.status = 0;
    throw error;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    // A wrong password on the login form is also a 401, but it is not a "session ended" event.
    if (response.status === 401 && !allow401) onUnauthorized();
    const error = new Error(data.error || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data;
}

// ---- Sign in / out
export const login = (email, password) => request('/auth/login', { method: 'POST', body: { email, password }, allow401: true });
export const logout = () => request('/auth/logout', { method: 'POST', allow401: true });
export const fetchMe = () => request('/auth/me', { allow401: true });

// ---- Team (admin only)
export const fetchUsers = () => request('/users');
export const createUser = (payload) => request('/users', { method: 'POST', body: payload });
export const resetUserPassword = (id, password) => request(`/users/${id}/password`, { method: 'PATCH', body: { password } });
export const deleteUser = (id) => request(`/users/${id}`, { method: 'DELETE' });

// ---- Sales tool
export const analyzeMessage = (payload) => request('/replies', { method: 'POST', body: payload });

export function fetchLeads({ status, q, intent, day, agent }) {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.set('status', status);
  if (q) params.set('q', q);
  if (intent) params.set('intent', intent);
  if (day) params.set('day', day);
  if (agent) params.set('agent', agent); // admin only: the server ignores it for a member
  return request(`/leads?${params.toString()}`);
}

export const updateLeadStatus = (id, status) => request(`/leads/${id}`, { method: 'PATCH', body: { status } });

export const addLeadNote = (id, text) => request(`/leads/${id}/notes`, { method: 'POST', body: { text } });

export const fetchProducts = () => request('/products');
// Admin only: manage the price list. Each of these sends the whole product, like the form does.
export const createProduct = (product) => request('/products', { method: 'POST', body: product });
export const updateProduct = (id, product) => request(`/products/${id}`, { method: 'PATCH', body: product });
export const deleteProduct = (id) => request(`/products/${id}`, { method: 'DELETE' });

export const fetchInsights = ({ days = 7 } = {}) => request(`/insights?days=${days}`);
