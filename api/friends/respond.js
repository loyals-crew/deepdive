import { sql } from '../_lib/db.js'
import { setCorsHeaders } from '../_lib/cors.js'
import { requireAuth } from '../_lib/auth.js'

export default async function handler(req, res) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = requireAuth(req, res)
  if (!user) return

  const { friendshipId, action } = req.body

  if (!friendshipId || !action) {
    return res.status(400).json({ error: 'friendshipId and action are required' })
  }
  if (!['accept', 'decline'].includes(action)) {
    return res.status(400).json({ error: 'action must be "accept" or "decline"' })
  }

  try {
    const [friendship] = await sql`
      SELECT id, requester_id, addressee_id, status
      FROM friendships
      WHERE id = ${friendshipId}
    `

    if (!friendship) return res.status(404).json({ error: 'Friendship not found' })

    // Only the addressee can respond to a request
    if (friendship.addressee_id !== user.sub) {
      return res.status(403).json({ error: 'Not authorized to respond to this request' })
    }

    if (friendship.status !== 'pending') {
      return res.status(409).json({ error: 'Request is no longer pending' })
    }

    const newStatus = action === 'accept' ? 'accepted' : 'declined'

    const [updated] = await sql`
      UPDATE friendships
      SET status = ${newStatus}, updated_at = NOW()
      WHERE id = ${friendshipId}
      RETURNING id, status, updated_at AS "updatedAt"
    `

    return res.status(200).json({ friendship: updated })
  } catch (err) {
    console.error('friend respond error', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
