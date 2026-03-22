const BASE = '/api'

async function apiFetch(path, token, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Request failed')
  return json
}

export const apiDiveSiteSearch = (token, q) =>
  apiFetch(`/dive-sites?q=${encodeURIComponent(q)}`, token)

export const apiDiveSiteCreate = (token, data) =>
  apiFetch('/dive-sites', token, {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const apiSpeciesSearch = (token, q = '', category = 'all') =>
  apiFetch(`/species?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}`, token)

export const apiDiveLogCreate = (token, data) =>
  apiFetch('/dive-logs', token, {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const apiMyDiveLogs = (token) =>
  apiFetch('/dive-logs', token)

export const apiDiveLogDetail = (token, id) =>
  apiFetch(`/dive-logs/${id}`, token)

export const apiFeedList = (token) =>
  apiFetch('/feed', token)

export const apiToggleLike = (token, logId) =>
  apiFetch(`/dive-logs/${logId}`, token, {
    method: 'POST',
    body: JSON.stringify({ action: 'like' }),
  })

export const apiGetComments = (token, logId) =>
  apiFetch(`/dive-logs/${logId}?c=1`, token)

export const apiAddComment = (token, logId, body, parentId = null) =>
  apiFetch(`/dive-logs/${logId}`, token, {
    method: 'POST',
    body: JSON.stringify({ action: 'comment', body, parentId }),
  })

export const apiDeleteComment = (token, logId, commentId) =>
  apiFetch(`/dive-logs/${logId}`, token, {
    method: 'DELETE',
    body: JSON.stringify({ commentId }),
  })
