/** HTTP transport kept separate from replay recording for easy replacement/testing. */
export function createAnalyticsTransport(endpoint, adminToken = '') {
  const base = String(endpoint || '').replace(/\/$/, '');
  const token = String(adminToken || '').trim();
  return async (path, body) => {
    if (!base || typeof fetch !== 'function') return false;
    try {
      const response = await fetch(base + path, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
        keepalive: true,
      });
      return response.ok;
    } catch {
      return false;
    }
  };
}
