import { useState } from 'react'

const EyeIcon = ({ show }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {show ? (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    ) : (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    )}
  </svg>
)

export default function Input({ label, name, type = 'text', value, onChange, error, placeholder, autoComplete }) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  }

  const labelStyle = {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: error ? 'var(--color-error)' : 'var(--color-deep)',
  }

  const inputWrapStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  }

  const inputStyle = {
    width: '100%',
    padding: isPassword ? '0.75rem 2.75rem 0.75rem 1rem' : '0.75rem 1rem',
    border: `2px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
    borderRadius: 'var(--radius-md)',
    fontSize: '1rem',
    color: 'var(--color-deep)',
    background: error ? 'var(--color-error-light)' : 'var(--color-surface)',
    outline: 'none',
    transition: 'border-color var(--transition), box-shadow var(--transition)',
  }

  const eyeStyle = {
    position: 'absolute',
    right: '0.75rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--color-muted)',
    display: 'flex',
    padding: '0.25rem',
    borderRadius: '4px',
  }

  const errorStyle = {
    fontSize: '0.8rem',
    color: 'var(--color-error)',
    fontWeight: '500',
  }

  const focusStyle = `
    input[name="${name}"]:focus {
      border-color: var(--color-turquoise);
      box-shadow: 0 0 0 3px rgba(0,180,216,0.15);
      background: white;
    }
  `

  return (
    <div style={containerStyle}>
      <style>{focusStyle}</style>
      {label && <label htmlFor={name} style={labelStyle}>{label}</label>}
      <div style={inputWrapStyle}>
        <input
          id={name}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          style={inputStyle}
        />
        {isPassword && (
          <button
            type="button"
            style={eyeStyle}
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <EyeIcon show={showPassword} />
          </button>
        )}
      </div>
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  )
}
