import { sql } from '../_lib/db.js'
import { setCorsHeaders } from '../_lib/cors.js'
import { requireAuth } from '../_lib/auth.js'

export default async function handler(req, res) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const user = requireAuth(req, res)
  if (!user) return

  const q = (req.query.q || '').trim()
  if (q.length < 2) return res.status(400).json({ error: 'Query must be at least 2 characters' })

  const searchPattern = `%${q}%`

  try {
    const rows = await sql`
      SELECT
        u.id,
        u.full_name        AS "fullName",
        u.experience_level AS "experienceLevel",
        CASE
          WHEN f.id IS NULL                                           THEN 'none'
          WHEN f.status = 'accepted'                                  THEN 'accepted'
          WHEN f.status = 'pending' AND f.requester_id = ${user.sub} THEN 'pending_sent'
          WHEN f.status = 'pending' AND f.addressee_id = ${user.sub} THEN 'pending_received'
          ELSE 'none'
        END AS "connectionStatus"
      FROM users u
      LEFT JOIN friendships f
        ON (f.requester_id = ${user.sub} AND f.addressee_id = u.id)
        OR (f.addressee_id = ${user.sub} AND f.requester_id = u.id)
      WHERE u.id <> ${user.sub}
        AND (
          u.full_name ILIKE ${searchPattern}
          OR u.email  ILIKE ${searchPattern}
        )
      ORDER BY u.full_name
      LIMIT 20
    `

    return res.status(200).json({ users: rows })
  } catch (err) {
    console.error('search error', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
