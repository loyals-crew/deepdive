import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/layout/AuthLayout'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Button from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { apiSignUp } from '../api/auth'
import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateRequired,
} from '../utils/validators'

const EXPERIENCE_OPTIONS = [
  { value: 'beginner', label: '🐠 Beginner — just starting out' },
  { value: 'intermediate', label: '🐙 Intermediate — comfortable underwater' },
  { value: 'advanced', label: '🦈 Advanced — deep & technical diver' },
]

export default function SignUp() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    experienceLevel: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setErrors((errs) => ({ ...errs, [name]: null }))
    setServerError('')
  }

  function validate() {
    const errs = {}
    errs.fullName = validateRequired(form.fullName, 'Full name')
    errs.email = validateEmail(form.email)
    errs.experienceLevel = validateRequired(form.experienceLevel, 'Experience level')
    errs.password = validatePassword(form.password)
    errs.confirmPassword = validateConfirmPassword(form.password, form.confirmPassword)
    return Object.fromEntries(Object.entries(errs).filter(([, v]) => v))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setIsLoading(true)
    try {
      const { token } = await apiSignUp({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        experienceLevel: form.experienceLevel,
      })
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
    gap: '1rem',
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
      <h1 style={headingStyle}>Join the reef</h1>
      <p style={subStyle}>Create your diver profile and dive in</p>
      <form onSubmit={handleSubmit} style={formStyle} noValidate>
        <Input
          label="Full Name"
          name="fullName"
          value={form.fullName}
          onChange={handleChange}
          error={errors.fullName}
          placeholder="Your name"
          autoComplete="name"
        />
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
        <Select
          label="Experience Level"
          name="experienceLevel"
          value={form.experienceLevel}
          onChange={handleChange}
          error={errors.experienceLevel}
          options={EXPERIENCE_OPTIONS}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />
        <Input
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          placeholder="Repeat your password"
          autoComplete="new-password"
        />
        {serverError && <div style={errorBannerStyle}>{serverError}</div>}
        <Button type="submit" isLoading={isLoading} style={{ marginTop: '0.25rem' }}>
          🪸 Join the Reef
        </Button>
      </form>
      <p style={linkRowStyle}>
        Already diving with us?{' '}
        <Link to="/signin">Sign in →</Link>
      </p>
    </AuthLayout>
  )
}
