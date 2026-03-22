import { sql } from '../_lib/db.js'
import { setCorsHeaders } from '../_lib/cors.js'
import { requireAuth } from '../_lib/auth.js'

export default async function handler(req, res) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = requireAuth(req, res)
  if (!user) return

  const { addresseeId } = req.body

  if (!addresseeId) return res.status(400).json({ error: 'addresseeId is required' })
  if (addresseeId === user.sub) return res.status(400).json({ error: 'Cannot send a request to yourself' })

  try {
    // Verify target user exists
    const [target] = await sql`SELECT id FROM users WHERE id = ${addresseeId}`
    if (!target) return res.status(404).json({ error: 'User not found' })

    // Check for any existing relationship in either direction
    const [existing] = await sql`
      SELECT id, status FROM friendships
      WHERE (requester_id = ${user.sub} AND addressee_id = ${addresseeId})
         OR (requester_id = ${addresseeId} AND addressee_id = ${user.sub})
    `

    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(409).json({ error: 'Already friends' })
      }
      if (existing.status === 'pending') {
        return res.status(409).json({ error: 'Friend request already exists' })
      }
      // status === 'declined' — allow re-request by resetting the row
      const [updated] = await sql`
        UPDATE friendships
        SET status = 'pending',
            requester_id = ${user.sub},
            addressee_id = ${addresseeId},
            updated_at = NOW()
        WHERE id = ${existing.id}
        RETURNING id, status
      `
      return res.status(200).json({ friendship: updated })
    }

    // Insert new request
    const [friendship] = await sql`
      INSERT INTO friendships (requester_id, addressee_id, status)
      VALUES (${user.sub}, ${addresseeId}, 'pending')
      RETURNING id, status, created_at AS "createdAt"
    `

    return res.status(201).json({ friendship })
  } catch (err) {
    console.error('friend request error', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
