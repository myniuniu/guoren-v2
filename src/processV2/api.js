/** Process V2 API */

const PROCESS_API = '/api/workflow/process';

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

export const processV2Api = {
  list: () => request(`${PROCESS_API}/list`),
  getByKey: (key) => request(`${PROCESS_API}/key/${encodeURIComponent(key)}`),
  getXml: (deploymentId) => request(`${PROCESS_API}/xml/${deploymentId}`),
  deploy: ({ name, xml }) =>
    request(`${PROCESS_API}/deploy`, {
      method: 'POST',
      body: JSON.stringify({ name, xml }),
    }),
};
