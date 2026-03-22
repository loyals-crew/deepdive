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
    // ── 1. Accepted friends ────────────────────────────────────────────────────
    const friends = await sql`
      SELECT
        u.id,
        u.full_name        AS "fullName",
        u.experience_level AS "experienceLevel",
        f.created_at       AS "friendsSince"
      FROM friendships f
      JOIN users u
        ON u.id = CASE
          WHEN f.requester_id = ${userId} THEN f.addressee_id
          ELSE f.requester_id
        END
      WHERE (f.requester_id = ${userId} OR f.addressee_id = ${userId})
        AND f.status = 'accepted'
      ORDER BY u.full_name
    `

    // ── 2. Pending incoming requests (current user is addressee) ───────────────
    const pending = await sql`
      SELECT
        f.id               AS "friendshipId",
        u.id               AS "userId",
        u.full_name        AS "fullName",
        u.experience_level AS "experienceLevel",
        f.created_at       AS "requestedAt"
      FROM friendships f
      JOIN users u ON u.id = f.requester_id
      WHERE f.addressee_id = ${userId}
        AND f.status = 'pending'
      ORDER BY f.created_at DESC
    `

    // ── 3. Level-2 recommendations (friends of friends) ───────────────────────
    const recommendations = await sql`
      WITH my_friends AS (
        SELECT
          CASE
            WHEN requester_id = ${userId} THEN addressee_id
            ELSE requester_id
          END AS friend_id
        FROM friendships
        WHERE (requester_id = ${userId} OR addressee_id = ${userId})
          AND status = 'accepted'
      ),
      fof_candidates AS (
        SELECT
          CASE
            WHEN f.requester_id = mf.friend_id THEN f.addressee_id
            ELSE f.requester_id
          END AS candidate_id,
          mf.friend_id AS via_friend_id
        FROM friendships f
        JOIN my_friends mf
          ON (f.requester_id = mf.friend_id OR f.addressee_id = mf.friend_id)
        WHERE f.status = 'accepted'
      ),
      already_connected AS (
        SELECT
          CASE
            WHEN requester_id = ${userId} THEN addressee_id
            ELSE requester_id
          END AS connected_id
        FROM friendships
        WHERE requester_id = ${userId} OR addressee_id = ${userId}
      )
      SELECT
        u.id,
        u.full_name        AS "fullName",
        u.experience_level AS "experienceLevel",
        COUNT(DISTINCT fof.via_friend_id)::int AS "mutualCount"
      FROM fof_candidates fof
      JOIN users u ON u.id = fof.candidate_id
      WHERE fof.candidate_id <> ${userId}
        AND fof.candidate_id NOT IN (SELECT connected_id FROM already_connected)
      GROUP BY u.id, u.full_name, u.experience_level
      ORDER BY "mutualCount" DESC, u.full_name
      LIMIT 20
    `

    return res.status(200).json({ friends, pending, recommendations })
  } catch (err) {
    console.error('friends list error', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
