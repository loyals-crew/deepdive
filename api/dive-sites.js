import { sql } from './_lib/db.js'
import { setCorsHeaders } from './_lib/cors.js'
import { requireAuth } from './_lib/auth.js'

export default async function handler(req, res) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  const user = requireAuth(req, res)
  if (!user) return

  // ── GET — search dive sites ──────────────────────────────────────────────────
  if (req.method === 'GET') {
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

  // ── POST — create a new dive site ────────────────────────────────────────────
  if (req.method === 'POST') {
    const { name, country, region, bodyOfWater, latitude, longitude } = req.body || {}

    if (!name?.trim())    return res.status(400).json({ error: 'Site name is required' })
    if (!country?.trim()) return res.status(400).json({ error: 'Country is required' })

    try {
      const [site] = await sql`
        INSERT INTO dive_sites (name, country, region, body_of_water, latitude, longitude)
        VALUES (
          ${name.trim()},
          ${country.trim()},
          ${region?.trim() ?? null},
          ${bodyOfWater ?? null},
          ${latitude    ?? null},
          ${longitude   ?? null}
        )
        RETURNING id, name, country, region, visit_count AS "visitCount"
      `
      return res.status(201).json({ site })
    } catch (err) {
      console.error('dive-sites create error', err)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
