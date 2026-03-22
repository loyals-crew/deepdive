import { sql } from '../_lib/db.js'
import { setCorsHeaders } from '../_lib/cors.js'
import { requireAuth } from '../_lib/auth.js'

export default async function handler(req, res) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = requireAuth(req, res)
  if (!user) return

  const { logId } = req.body
  if (!logId) return res.status(400).json({ error: 'logId is required' })

  try {
    // Verify log exists and is accessible
    const [log] = await sql`SELECT id FROM dive_logs WHERE id = ${logId} AND privacy != 'private'`
    if (!log) return res.status(404).json({ error: 'Dive log not found' })

    // Try to insert — if it exists, delete instead (toggle)
    const inserted = await sql`
      INSERT INTO dive_log_likes (dive_log_id, user_id)
      VALUES (${logId}, ${user.sub})
      ON CONFLICT (dive_log_id, user_id) DO NOTHING
    `

    let liked = true
    if (inserted.count === 0) {
      // Already liked — remove it
      await sql`
        DELETE FROM dive_log_likes
        WHERE dive_log_id = ${logId} AND user_id = ${user.sub}
      `
      liked = false
    }

    const [{ likeCount }] = await sql`
      SELECT COUNT(*)::int AS "likeCount"
      FROM dive_log_likes
      WHERE dive_log_id = ${logId}
    `

    return res.status(200).json({ liked, likeCount })
  } catch (err) {
    console.error('dive-logs like error', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
