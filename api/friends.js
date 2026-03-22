import { sql } from './_lib/db.js'
import { setCorsHeaders } from './_lib/cors.js'
import { requireAuth } from './_lib/auth.js'

export default async function handler(req, res) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  const user = requireAuth(req, res)
  if (!user) return
  const userId = user.sub

  // ── GET — list friends + pending requests + recommendations ──────────────────
  if (req.method === 'GET') {
    try {
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

  // ── POST — send request (addresseeId) OR respond (friendshipId + action) ─────
  if (req.method === 'POST') {
    const { addresseeId, friendshipId, action } = req.body || {}

    // Send friend request
    if (addresseeId) {
      if (addresseeId === userId) return res.status(400).json({ error: 'Cannot send a request to yourself' })

      try {
        const [target] = await sql`SELECT id FROM users WHERE id = ${addresseeId}`
        if (!target) return res.status(404).json({ error: 'User not found' })

        const [existing] = await sql`
          SELECT id, status FROM friendships
          WHERE (requester_id = ${userId} AND addressee_id = ${addresseeId})
             OR (requester_id = ${addresseeId} AND addressee_id = ${userId})
        `

        if (existing) {
          if (existing.status === 'accepted') return res.status(409).json({ error: 'Already friends' })
          if (existing.status === 'pending')  return res.status(409).json({ error: 'Friend request already exists' })
          const [updated] = await sql`
            UPDATE friendships
            SET status = 'pending', requester_id = ${userId}, addressee_id = ${addresseeId}, updated_at = NOW()
            WHERE id = ${existing.id}
            RETURNING id, status
          `
          return res.status(200).json({ friendship: updated })
        }

        const [friendship] = await sql`
          INSERT INTO friendships (requester_id, addressee_id, status)
          VALUES (${userId}, ${addresseeId}, 'pending')
          RETURNING id, status, created_at AS "createdAt"
        `
        return res.status(201).json({ friendship })
      } catch (err) {
        console.error('friend request error', err)
        return res.status(500).json({ error: 'Internal server error' })
      }
    }

    // Respond to request (accept / decline)
    if (friendshipId && action) {
      if (!['accept', 'decline'].includes(action)) {
        return res.status(400).json({ error: 'action must be "accept" or "decline"' })
      }

      try {
        const [friendship] = await sql`
          SELECT id, requester_id, addressee_id, status FROM friendships WHERE id = ${friendshipId}
        `
        if (!friendship)                          return res.status(404).json({ error: 'Friendship not found' })
        if (friendship.addressee_id !== userId)   return res.status(403).json({ error: 'Not authorized to respond to this request' })
        if (friendship.status !== 'pending')      return res.status(409).json({ error: 'Request is no longer pending' })

        const newStatus = action === 'accept' ? 'accepted' : 'declined'
        const [updated] = await sql`
          UPDATE friendships SET status = ${newStatus}, updated_at = NOW()
          WHERE id = ${friendshipId}
          RETURNING id, status, updated_at AS "updatedAt"
        `
        return res.status(200).json({ friendship: updated })
      } catch (err) {
        console.error('friend respond error', err)
        return res.status(500).json({ error: 'Internal server error' })
      }
    }

    return res.status(400).json({ error: 'addresseeId or (friendshipId + action) required' })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
