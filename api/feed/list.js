import { sql } from '../_lib/db.js'
import { setCorsHeaders } from '../_lib/cors.js'
import { requireAuth } from '../_lib/auth.js'

export default async function handler(req, res) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const user = requireAuth(req, res)
  if (!user) return

  const userId = user.sub

  try {
    const feed = await sql`
      WITH level1 AS (
        SELECT
          CASE
            WHEN requester_id = ${userId} THEN addressee_id
            ELSE requester_id
          END AS friend_id
        FROM friendships
        WHERE (requester_id = ${userId} OR addressee_id = ${userId})
          AND status = 'accepted'
      ),
      level2 AS (
        SELECT
          CASE
            WHEN f.requester_id = l1.friend_id THEN f.addressee_id
            ELSE f.requester_id
          END AS friend_id
        FROM friendships f
        JOIN level1 l1 ON (f.requester_id = l1.friend_id OR f.addressee_id = l1.friend_id)
        WHERE f.status = 'accepted'
          AND CASE
            WHEN f.requester_id = l1.friend_id THEN f.addressee_id
            ELSE f.requester_id
          END <> ${userId}
      ),
      visible_users AS (
        SELECT friend_id FROM level1
        UNION
        SELECT friend_id FROM level2
      )
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
        dl.entry_type            AS "entryType",
        dl.water_temp_bottom_c   AS "waterTempC",
        dl.created_at            AS "createdAt",
        u.id                     AS "authorId",
        u.full_name              AS "authorName",
        u.experience_level       AS "authorLevel",
        COUNT(DISTINCT dll.id)::int AS "likeCount",
        COUNT(DISTINCT dlcom.id)::int AS "commentCount",
        EXISTS(
          SELECT 1 FROM dive_log_likes
          WHERE dive_log_id = dl.id AND user_id = ${userId}
        )                        AS "likedByMe",
        COALESCE(
          json_agg(DISTINCT ms.emoji) FILTER (WHERE ms.emoji IS NOT NULL),
          '[]'::json
        )                        AS "animalEmojis"
      FROM dive_logs dl
      JOIN users u ON u.id = dl.user_id
      LEFT JOIN dive_log_likes dll ON dll.dive_log_id = dl.id
      LEFT JOIN dive_log_comments dlcom
        ON dlcom.dive_log_id = dl.id AND dlcom.parent_id IS NULL
      LEFT JOIN dive_log_animals dla ON dla.dive_log_id = dl.id
      LEFT JOIN marine_species ms ON ms.id = dla.species_id
      WHERE dl.user_id IN (SELECT friend_id FROM visible_users)
        AND dl.privacy = 'public'
      GROUP BY dl.id, u.id, u.full_name, u.experience_level
      ORDER BY dl.created_at DESC
      LIMIT 20
    `

    return res.status(200).json({ feed })
  } catch (err) {
    console.error('feed list error', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
