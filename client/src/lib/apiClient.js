export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }

  /** Field → message map for form validation errors. */
  get fieldErrors() {
    return Object.fromEntries((this.details ?? []).map((d) => [d.path, d.message]));
  }
}

const API_BASE = import.meta.env.VITE_API_URL ?? '';

function buildUrl(path, query) {
  const params = new URLSearchParams();
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, value);
  });
  const qs = params.toString();
  return `${API_BASE}/api${path}${qs ? `?${qs}` : ''}`;
}

export async function apiRequest(path, { method = 'GET', body, query, signal } = {}) {
  const res = await fetch(buildUrl(path, query), {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error ?? 'Something went wrong', data.details);
  return data;
}
