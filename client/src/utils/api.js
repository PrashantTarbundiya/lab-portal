const RAW_API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || '/api';
const API_BASE = RAW_API_BASE.replace(/\/+$/, '');

function buildApiUrl(path) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (API_BASE.startsWith('http')) {
    if (API_BASE.endsWith('/api') && cleanPath.startsWith('/api')) {
      return `${API_BASE}${cleanPath.substring(4)}`;
    }
    if (!API_BASE.endsWith('/api') && !cleanPath.startsWith('/api')) {
      return `${API_BASE}/api${cleanPath}`;
    }
  }
  return `${API_BASE}${cleanPath}`;
}

function resolveToken(explicitToken, apiPath = '') {
  if (explicitToken) return explicitToken;
  if (typeof window === 'undefined') return null;

  const currentPath = window.location.pathname || '';
  const stored = localStorage.getItem('portal_token');

  // Super Admin portal context or admin management API
  if (currentPath === '/admin' || currentPath.includes('/superadmin') || apiPath.startsWith('/admin')) {
    if (stored && (stored === 'demo-admin' || stored.startsWith('ey'))) {
      return stored;
    }
    return 'demo-admin';
  }

  // Hospital Admin / Superintendent context
  if (currentPath.includes('/admin') || apiPath.includes('/hospitals')) {
    if (stored && (stored.startsWith('demo-staff') || stored === 'demo-admin' || stored.startsWith('ey'))) {
      return stored;
    }
    return 'demo-staff';
  }

  // Doctor portal context or doctor API
  if (currentPath.includes('/doctor') || apiPath.startsWith('/doctors')) {
    if (stored && (stored === 'demo-doctor' || stored.startsWith('ey') || (!stored.startsWith('demo-patient') && !stored.startsWith('demo-staff') && !stored.startsWith('demo-admin')))) {
      return stored;
    }
    return 'demo-doctor';
  }

  // Staff portal context: Front Desk, Lab Tasks, Staff worklist, Home Collections for staff
  const isStaffContext =
    currentPath.includes('/front-desk') ||
    currentPath.includes('/lab-tasks') ||
    currentPath.startsWith('/staff') ||
    apiPath.startsWith('/staff') ||
    apiPath.startsWith('/tasks') ||
    apiPath.startsWith('/audit') ||
    apiPath.startsWith('/lab') ||
    ((apiPath.startsWith('/orders') || apiPath.includes('home-collections')) && (currentPath.includes('/front-desk') || currentPath.includes('/lab-tasks') || currentPath.startsWith('/staff')));

  if (isStaffContext) {
    if (stored && (stored === 'demo-staff' || stored.startsWith('ey') || (!stored.startsWith('demo-patient') && !stored.startsWith('demo-doctor') && !stored.startsWith('demo-admin')))) {
      return stored;
    }
    return 'demo-staff';
  }

  // Default patient context
  if (stored && !stored.startsWith('demo-doctor') && !stored.startsWith('demo-staff') && !stored.startsWith('demo-admin')) {
    return stored;
  }
  return 'demo-patient:+919000000001';
}

export async function api(path, options = {}) {
  const { method = 'GET', body, token } = options;
  const headers = { 'Content-Type': 'application/json' };
  
  // Resolve auth token dynamically by role context
  const authToken = resolveToken(token, path);

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch(buildApiUrl(path), {
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
  const authToken = resolveToken(token, path);

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch(buildApiUrl(path), {
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
