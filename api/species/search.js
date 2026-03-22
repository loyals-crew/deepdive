import { sql } from '../_lib/db.js'
import { setCorsHeaders } from '../_lib/cors.js'
import { requireAuth } from '../_lib/auth.js'

export default async function handler(req, res) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const user = requireAuth(req, res)
  if (!user) return

  const q        = (req.query.q        || '').trim()
  const category = (req.query.category || 'all').trim()

  const validCategories = ['all', 'fish', 'shark_ray', 'turtle', 'cephalopod', 'crustacean', 'mammal', 'nudibranch', 'other']
  const cat = validCategories.includes(category) ? category : 'all'
  const pattern = q ? `%${q}%` : null

  try {
    const species = await sql`
      SELECT
        id,
        common_name     AS "commonName",
        scientific_name AS "scientificName",
        category,
        emoji
      FROM marine_species
      WHERE (${pattern}::text IS NULL OR common_name ILIKE ${pattern ?? ''})
        AND (${cat} = 'all' OR category = ${cat})
      ORDER BY category, common_name
      LIMIT 80
    `
    return res.status(200).json({ species })
  } catch (err) {
    console.error('species search error', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
