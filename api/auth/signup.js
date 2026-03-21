import bcrypt from 'bcryptjs'
import { sql } from '../_lib/db.js'
import { signToken } from '../_lib/jwt.js'
import { setCorsHeaders } from '../_lib/cors.js'

export default async function handler(req, res) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { fullName, email, password, experienceLevel } = req.body

  if (!fullName || !email || !password || !experienceLevel)
    return res.status(400).json({ error: 'All fields are required' })

  if (password.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters' })

  if (!['beginner', 'intermediate', 'advanced'].includes(experienceLevel))
    return res.status(400).json({ error: 'Invalid experience level' })

  try {
    const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`
    if (existing.length > 0)
      return res.status(409).json({ error: 'Email already registered' })

    const passwordHash = await bcrypt.hash(password, 12)

    const [user] = await sql`
      INSERT INTO users (email, password_hash, full_name, experience_level)
      VALUES (${email.toLowerCase()}, ${passwordHash}, ${fullName.trim()}, ${experienceLevel})
      RETURNING id, email, full_name, experience_level, created_at
    `

    const token = signToken({ sub: user.id, email: user.email, name: user.full_name })

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        experienceLevel: user.experience_level,
      },
    })
  } catch (err) {
    console.error('signup error', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
