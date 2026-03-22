import { sql } from '../_lib/db.js'
import { setCorsHeaders } from '../_lib/cors.js'
import { requireAuth } from '../_lib/auth.js'

export default async function handler(req, res) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = requireAuth(req, res)
  if (!user) return

  const { commentId } = req.body
  if (!commentId) return res.status(400).json({ error: 'commentId is required' })

  try {
    const [comment] = await sql`
      SELECT id, user_id FROM dive_log_comments WHERE id = ${commentId}
    `

    if (!comment) return res.status(404).json({ error: 'Comment not found' })
    if (comment.user_id !== user.sub) return res.status(403).json({ error: 'Cannot delete another user\'s comment' })

    await sql`DELETE FROM dive_log_comments WHERE id = ${commentId}`

    return res.status(200).json({ deleted: true })
  } catch (err) {
    console.error('comment-delete error', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
