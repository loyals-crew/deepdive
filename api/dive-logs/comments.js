import { sql } from '../_lib/db.js'
import { setCorsHeaders } from '../_lib/cors.js'
import { requireAuth } from '../_lib/auth.js'

export default async function handler(req, res) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  const user = requireAuth(req, res)
  if (!user) return

  // ── GET — list comments for a log ──────────────────────────────────────────
  if (req.method === 'GET') {
    const logId = req.query.logId
    if (!logId) return res.status(400).json({ error: 'logId is required' })

    try {
      // Fetch top-level comments
      const topLevel = await sql`
        SELECT
          c.id,
          c.body,
          c.created_at AS "createdAt",
          u.id         AS "userId",
          u.full_name  AS "authorName"
        FROM dive_log_comments c
        JOIN users u ON u.id = c.user_id
        WHERE c.dive_log_id = ${logId}
          AND c.parent_id IS NULL
        ORDER BY c.created_at ASC
      `

      // Fetch all replies for this log
      const replies = await sql`
        SELECT
          c.id,
          c.parent_id  AS "parentId",
          c.body,
          c.created_at AS "createdAt",
          u.id         AS "userId",
          u.full_name  AS "authorName"
        FROM dive_log_comments c
        JOIN users u ON u.id = c.user_id
        WHERE c.dive_log_id = ${logId}
          AND c.parent_id IS NOT NULL
        ORDER BY c.created_at ASC
      `

      // Nest replies under their parent
      const replyMap = {}
      for (const r of replies) {
        if (!replyMap[r.parentId]) replyMap[r.parentId] = []
        replyMap[r.parentId].push(r)
      }

      const comments = topLevel.map((c) => ({ ...c, replies: replyMap[c.id] ?? [] }))
      return res.status(200).json({ comments })
    } catch (err) {
      console.error('comments GET error', err)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  // ── POST — add a comment ────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { logId, body, parentId } = req.body
    if (!logId) return res.status(400).json({ error: 'logId is required' })
    if (!body?.trim()) return res.status(400).json({ error: 'Comment body is required' })

    try {
      // Verify log exists and is accessible
      const [log] = await sql`SELECT id FROM dive_logs WHERE id = ${logId} AND privacy != 'private'`
      if (!log) return res.status(404).json({ error: 'Dive log not found' })

      // If it's a reply, verify parent exists in this log
      if (parentId) {
        const [parent] = await sql`
          SELECT id FROM dive_log_comments
          WHERE id = ${parentId} AND dive_log_id = ${logId} AND parent_id IS NULL
        `
        if (!parent) return res.status(400).json({ error: 'Parent comment not found' })
      }

      const [comment] = await sql`
        INSERT INTO dive_log_comments (dive_log_id, user_id, parent_id, body)
        VALUES (
          ${logId},
          ${user.sub},
          ${parentId || null},
          ${body.trim()}
        )
        RETURNING id, body, created_at AS "createdAt", parent_id AS "parentId"
      `

      return res.status(201).json({
        comment: {
          ...comment,
          userId:     user.sub,
          authorName: user.name,
          replies:    [],
        },
      })
    } catch (err) {
      console.error('comments POST error', err)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
