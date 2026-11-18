// Client-side helper for calling the REST API.
export async function api(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

export const rp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
