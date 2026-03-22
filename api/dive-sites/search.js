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
  if (!q) return res.status(200).json({ sites: [] })

  const pattern = `%${q}%`

  try {
    const sites = await sql`
      SELECT id, name, country, region, visit_count AS "visitCount"
      FROM dive_sites
      WHERE name    ILIKE ${pattern}
         OR country ILIKE ${pattern}
      ORDER BY visit_count DESC, name ASC
      LIMIT 10
    `
    return res.status(200).json({ sites })
  } catch (err) {
    console.error('dive-sites search error', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
