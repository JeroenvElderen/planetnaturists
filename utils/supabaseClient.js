const fetch = require('node-fetch');

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_ANON_KEY,
} = process.env;

const SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
const isConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

if (!isConfigured) {
  console.warn(
    '⚠️  Supabase configuration missing. Running in offline mode with empty data.'
  );
}

const BASE_URL = SUPABASE_URL
  ? `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1`
  : null;

function buildQuery(params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    search.append(key, value);
  }
  return search.toString();
}

async function supabaseFetch(path, { method = 'GET', headers = {}, body, prefer } = {}) {
  if (!isConfigured) {
    throw new Error('Supabase is not configured.');
  }

  const url = `${BASE_URL}/${path}`;
  const finalHeaders = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    Accept: 'application/json',
    ...headers,
  };

  if (prefer) {
    finalHeaders.Prefer = prefer;
  }

  let payload;
  if (body !== undefined) {
    finalHeaders['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: payload,
    });
  } catch (err) {
    throw new Error(`Supabase request failed to fetch ${url}: ${err.message}`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Supabase request failed (${response.status} ${response.statusText}): ${errorText}`
    );
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

async function select(table, { columns = '*', filter = {}, order, limit, single = false } = {}) {
  const params = { select: columns, ...filter };
  if (order) params.order = order;
  if (limit !== undefined) params.limit = String(limit);

  const query = buildQuery(params);
  const result = await supabaseFetch(`${table}?${query}`);

  if (single) {
    if (Array.isArray(result) && result.length > 0) {
      return result[0];
    }
    return null;
  }

  return Array.isArray(result) ? result : [];
}

async function upsert(table, rows) {
  const payload = Array.isArray(rows) ? rows : [rows];
  if (!payload.length) return null;
  return supabaseFetch(table, {
    method: 'POST',
    body: payload,
    prefer: 'resolution=merge-duplicates',
  });
}

async function insert(table, rows) {
  const payload = Array.isArray(rows) ? rows : [rows];
  if (!payload.length) return null;
  return supabaseFetch(table, {
    method: 'POST',
    body: payload,
  });
}

async function remove(table, filter = {}) {
  const query = buildQuery(filter);
  return supabaseFetch(`${table}?${query}`, { method: 'DELETE' });
}

module.exports = {
  select,
  upsert,
  insert,
  remove,
  supabaseFetch,
};
