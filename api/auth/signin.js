import bcrypt from 'bcryptjs'
import { sql } from '../_lib/db.js'
import { signToken } from '../_lib/jwt.js'
import { setCorsHeaders } from '../_lib/cors.js'

export default async function handler(req, res) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, password } = req.body

  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' })

  try {
    const [user] = await sql`SELECT * FROM users WHERE email = ${email.toLowerCase()}`

    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    const token = signToken({ sub: user.id, email: user.email, name: user.full_name })

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        experienceLevel: user.experience_level,
      },
    })
  } catch (err) {
    console.error('signin error', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
