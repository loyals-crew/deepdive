import { sql } from '../_lib/db.js'
import { setCorsHeaders } from '../_lib/cors.js'
import { requireAuth } from '../_lib/auth.js'

export default async function handler(req, res) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const user = requireAuth(req, res)
  if (!user) return

  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'Log ID required' })

  try {
    const [log] = await sql`
      SELECT
        dl.*,
        u.full_name        AS "authorName",
        u.experience_level AS "authorLevel",
        COUNT(DISTINCT dll.id)::int AS "likeCount",
        EXISTS(
          SELECT 1 FROM dive_log_likes
          WHERE dive_log_id = dl.id AND user_id = ${user.sub}
        )                  AS "likedByMe"
      FROM dive_logs dl
      JOIN users u ON u.id = dl.user_id
      LEFT JOIN dive_log_likes dll ON dll.dive_log_id = dl.id
      WHERE dl.id = ${id}
        AND (
          dl.privacy = 'public'
          OR dl.user_id = ${user.sub}
          OR (
            dl.privacy = 'friends'
            AND EXISTS (
              SELECT 1 FROM friendships
              WHERE status = 'accepted'
                AND (
                  (requester_id = ${user.sub} AND addressee_id = dl.user_id)
                  OR (addressee_id = ${user.sub} AND requester_id = dl.user_id)
                )
            )
          )
        )
      GROUP BY dl.id, u.full_name, u.experience_level
    `

    if (!log) return res.status(404).json({ error: 'Dive log not found or not accessible' })

    // Fetch animals
    const animals = await sql`
      SELECT
        dla.id,
        dla.count,
        dla.custom_name AS "customName",
        dla.photo_url   AS "photoUrl",
        ms.id           AS "speciesId",
        ms.emoji,
        ms.common_name  AS "speciesName",
        ms.category
      FROM dive_log_animals dla
      LEFT JOIN marine_species ms ON ms.id = dla.species_id
      WHERE dla.dive_log_id = ${id}
      ORDER BY ms.category, ms.common_name
    `

    // Fetch companions
    const companions = await sql`
      SELECT
        dlc.id,
        dlc.name,
        dlc.role,
        dlc.verified,
        dlc.user_id AS "userId"
      FROM dive_log_companions dlc
      WHERE dlc.dive_log_id = ${id}
      ORDER BY dlc.role, dlc.name
    `

    return res.status(200).json({ log, animals, companions })
  } catch (err) {
    console.error('dive-logs detail error', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
