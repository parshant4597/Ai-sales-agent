// All calls to the Express API live here, so components never build URLs.

async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

export const analyzeMessage = (payload) => request('/replies', { method: 'POST', body: payload });

export function fetchLeads({ status, q }) {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.set('status', status);
  if (q) params.set('q', q);
  return request(`/leads?${params.toString()}`);
}

export const updateLeadStatus = (id, status) => request(`/leads/${id}`, { method: 'PATCH', body: { status } });

export const addLeadNote = (id, text) => request(`/leads/${id}/notes`, { method: 'POST', body: { text } });

export const fetchProducts = () => request('/products');
