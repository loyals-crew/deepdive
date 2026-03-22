import { sql } from '../_lib/db.js'
import { setCorsHeaders } from '../_lib/cors.js'
import { requireAuth } from '../_lib/auth.js'

export default async function handler(req, res) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  const user = requireAuth(req, res)
  if (!user) return

  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'Log ID required' })

  // ── GET — detail view OR comments list ──────────────────────────────────────
  if (req.method === 'GET') {
    // ?c=1 → return comments
    if (req.query.c) {
      try {
        const topLevel = await sql`
          SELECT
            c.id,
            c.body,
            c.created_at AS "createdAt",
            u.id         AS "userId",
            u.full_name  AS "authorName"
          FROM dive_log_comments c
          JOIN users u ON u.id = c.user_id
          WHERE c.dive_log_id = ${id}
            AND c.parent_id IS NULL
          ORDER BY c.created_at ASC
        `
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
          WHERE c.dive_log_id = ${id}
            AND c.parent_id IS NOT NULL
          ORDER BY c.created_at ASC
        `
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

    // Default → dive log detail
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

  // ── POST — like toggle OR add comment ────────────────────────────────────────
  if (req.method === 'POST') {
    const { action, body, parentId } = req.body || {}

    // Toggle like
    if (action === 'like') {
      try {
        const [log] = await sql`SELECT id FROM dive_logs WHERE id = ${id} AND privacy != 'private'`
        if (!log) return res.status(404).json({ error: 'Dive log not found' })

        const inserted = await sql`
          INSERT INTO dive_log_likes (dive_log_id, user_id)
          VALUES (${id}, ${user.sub})
          ON CONFLICT (dive_log_id, user_id) DO NOTHING
        `
        let liked = true
        if (inserted.count === 0) {
          await sql`DELETE FROM dive_log_likes WHERE dive_log_id = ${id} AND user_id = ${user.sub}`
          liked = false
        }
        const [{ likeCount }] = await sql`
          SELECT COUNT(*)::int AS "likeCount" FROM dive_log_likes WHERE dive_log_id = ${id}
        `
        return res.status(200).json({ liked, likeCount })
      } catch (err) {
        console.error('dive-logs like error', err)
        return res.status(500).json({ error: 'Internal server error' })
      }
    }

    // Add comment
    if (action === 'comment') {
      if (!body?.trim()) return res.status(400).json({ error: 'Comment body is required' })

      try {
        const [log] = await sql`SELECT id FROM dive_logs WHERE id = ${id} AND privacy != 'private'`
        if (!log) return res.status(404).json({ error: 'Dive log not found' })

        if (parentId) {
          const [parent] = await sql`
            SELECT id FROM dive_log_comments
            WHERE id = ${parentId} AND dive_log_id = ${id} AND parent_id IS NULL
          `
          if (!parent) return res.status(400).json({ error: 'Parent comment not found' })
        }

        const [comment] = await sql`
          INSERT INTO dive_log_comments (dive_log_id, user_id, parent_id, body)
          VALUES (${id}, ${user.sub}, ${parentId || null}, ${body.trim()})
          RETURNING id, body, created_at AS "createdAt", parent_id AS "parentId"
        `
        return res.status(201).json({
          comment: { ...comment, userId: user.sub, authorName: user.name, replies: [] },
        })
      } catch (err) {
        console.error('comments POST error', err)
        return res.status(500).json({ error: 'Internal server error' })
      }
    }

    return res.status(400).json({ error: 'action must be "like" or "comment"' })
  }

  // ── DELETE — delete a comment ────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const { commentId } = req.body || {}
    if (!commentId) return res.status(400).json({ error: 'commentId is required' })

    try {
      const [comment] = await sql`SELECT id, user_id FROM dive_log_comments WHERE id = ${commentId}`
      if (!comment)                       return res.status(404).json({ error: 'Comment not found' })
      if (comment.user_id !== user.sub)   return res.status(403).json({ error: "Cannot delete another user's comment" })

      await sql`DELETE FROM dive_log_comments WHERE id = ${commentId}`
      return res.status(200).json({ deleted: true })
    } catch (err) {
      console.error('comment-delete error', err)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
