const API_BASE = '/api';

export async function api(path, options = {}) {
  const { method = 'GET', body, token } = options;
  const headers = { 'Content-Type': 'application/json' };
  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('portal_token') : null);
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function apiUpload(path, formData, token) {
  const headers = {};
  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('portal_token') : null);
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}
