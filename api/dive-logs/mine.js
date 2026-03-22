import { sql } from '../_lib/db.js'
import { setCorsHeaders } from '../_lib/cors.js'
import { requireAuth } from '../_lib/auth.js'

export default async function handler(req, res) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const user = requireAuth(req, res)
  if (!user) return

  try {
    const logs = await sql`
      SELECT
        dl.id,
        dl.title,
        dl.dive_site_name        AS "siteName",
        dl.country,
        dl.dive_date             AS "diveDate",
        dl.max_depth_m           AS "maxDepthM",
        dl.duration_min          AS "durationMin",
        dl.visibility,
        dl.current,
        dl.privacy,
        dl.created_at            AS "createdAt",
        COALESCE(
          json_agg(
            json_build_object('emoji', ms.emoji, 'name', ms.common_name)
            ORDER BY ms.common_name
          ) FILTER (WHERE ms.id IS NOT NULL),
          '[]'::json
        )                        AS animals,
        COUNT(DISTINCT dll.id)::int AS "likeCount"
      FROM dive_logs dl
      LEFT JOIN dive_log_animals dla ON dla.dive_log_id = dl.id
      LEFT JOIN marine_species   ms  ON ms.id = dla.species_id
      LEFT JOIN dive_log_likes   dll ON dll.dive_log_id = dl.id
      WHERE dl.user_id = ${user.sub}
      GROUP BY dl.id
      ORDER BY dl.dive_date DESC, dl.created_at DESC
    `
    return res.status(200).json({ logs })
  } catch (err) {
    console.error('dive-logs mine error', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
