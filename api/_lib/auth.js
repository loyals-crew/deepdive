import { verifyToken } from './jwt.js'

/**
 * Extracts and verifies the Bearer JWT from the Authorization header.
 * Returns the decoded payload { sub, email, name, exp } on success.
 * Sends 401 and returns null on failure — callers should `if (!user) return`.
 */
export function requireAuth(req, res) {
  const header = req.headers['authorization'] || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    res.status(401).json({ error: 'Authentication required' })
    return null
  }

  try {
    return verifyToken(token)
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
    return null
  }
}
