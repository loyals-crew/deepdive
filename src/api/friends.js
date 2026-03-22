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

export const apiFriendsList = (token) =>
  apiFetch('/friends', token)

export const apiUsersSearch = (token, query) =>
  apiFetch(`/users/search?q=${encodeURIComponent(query)}`, token)

export const apiFriendRequest = (token, addresseeId) =>
  apiFetch('/friends', token, {
    method: 'POST',
    body: JSON.stringify({ addresseeId }),
  })

export const apiFriendRespond = (token, friendshipId, action) =>
  apiFetch('/friends', token, {
    method: 'POST',
    body: JSON.stringify({ friendshipId, action }),
  })
