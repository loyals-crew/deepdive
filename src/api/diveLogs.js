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
  apiFetch(`/dive-sites/search?q=${encodeURIComponent(q)}`, token)

export const apiDiveSiteCreate = (token, data) =>
  apiFetch('/dive-sites/create', token, {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const apiSpeciesSearch = (token, q = '', category = 'all') =>
  apiFetch(`/species/search?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}`, token)

export const apiDiveLogCreate = (token, data) =>
  apiFetch('/dive-logs/create', token, {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const apiMyDiveLogs = (token) =>
  apiFetch('/dive-logs/mine', token)

export const apiDiveLogDetail = (token, id) =>
  apiFetch(`/dive-logs/${id}`, token)

export const apiFeedList = (token) =>
  apiFetch('/feed/list', token)

export const apiToggleLike = (token, logId) =>
  apiFetch('/dive-logs/like', token, {
    method: 'POST',
    body: JSON.stringify({ logId }),
  })

export const apiGetComments = (token, logId) =>
  apiFetch(`/dive-logs/comments?logId=${encodeURIComponent(logId)}`, token)

export const apiAddComment = (token, logId, body, parentId = null) =>
  apiFetch('/dive-logs/comments', token, {
    method: 'POST',
    body: JSON.stringify({ logId, body, parentId }),
  })

export const apiDeleteComment = (token, commentId) =>
  apiFetch('/dive-logs/comment-delete', token, {
    method: 'POST',
    body: JSON.stringify({ commentId }),
  })
