import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/layout/AuthLayout'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { apiSignIn } from '../api/auth'
import { validateEmail, validateRequired } from '../utils/validators'

export default function SignIn() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setErrors((e) => ({ ...e, [name]: null }))
    setServerError('')
  }

  function validate() {
    const errs = {}
    errs.email = validateEmail(form.email)
    errs.password = validateRequired(form.password, 'Password')
    return Object.fromEntries(Object.entries(errs).filter(([, v]) => v))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setIsLoading(true)
    try {
      const { token } = await apiSignIn({ email: form.email, password: form.password })
      login(token)
      navigate('/')
    } catch (err) {
      setServerError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const headingStyle = {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: 'var(--color-deep)',
    marginBottom: '0.35rem',
    textAlign: 'center',
  }

  const subStyle = {
    fontSize: '0.9rem',
    color: 'var(--color-muted)',
    textAlign: 'center',
    marginBottom: '1.75rem',
  }

  const formStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.1rem',
  }

  const errorBannerStyle = {
    background: 'var(--color-error-light)',
    border: '1px solid #FCA5A5',
    borderRadius: 'var(--radius-sm)',
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    color: 'var(--color-error)',
    fontWeight: '500',
    textAlign: 'center',
  }

  const linkRowStyle = {
    textAlign: 'center',
    fontSize: '0.9rem',
    color: 'var(--color-muted)',
    marginTop: '0.5rem',
  }

  return (
    <AuthLayout>
      <h1 style={headingStyle}>Welcome back, diver</h1>
      <p style={subStyle}>Sign in to reconnect with the reef</p>
      <form onSubmit={handleSubmit} style={formStyle} noValidate>
        <Input
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="your@email.com"
          autoComplete="email"
        />
        <Input
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          placeholder="Your password"
          autoComplete="current-password"
        />
        {serverError && <div style={errorBannerStyle}>{serverError}</div>}
        <Button type="submit" isLoading={isLoading} style={{ marginTop: '0.25rem' }}>
          🤿 Dive In
        </Button>
      </form>
      <p style={linkRowStyle}>
        New here?{' '}
        <Link to="/signup">Join the reef →</Link>
      </p>
    </AuthLayout>
  )
}
