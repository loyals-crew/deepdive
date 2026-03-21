const styles = {
  base: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    width: '100%',
    padding: '0.85rem 1.5rem',
    borderRadius: 'var(--radius-md)',
    fontSize: '1rem',
    fontWeight: '700',
    letterSpacing: '0.01em',
    transition: 'all var(--transition)',
    cursor: 'pointer',
    border: 'none',
  },
  primary: {
    background: 'var(--color-coral)',
    color: '#fff',
    boxShadow: 'var(--shadow-btn)',
  },
  primaryHover: {
    background: 'var(--color-coral-dark)',
  },
  outline: {
    background: 'transparent',
    color: 'var(--color-turquoise-dark)',
    border: '2px solid var(--color-turquoise)',
  },
  outlineHover: {
    background: 'var(--color-turquoise-light)',
  },
  disabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
}

const Spinner = () => (
  <span style={{
    display: 'inline-block',
    width: '18px',
    height: '18px',
    border: '2.5px solid rgba(255,255,255,0.4)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  }} />
)

const spinKeyframe = `@keyframes spin { to { transform: rotate(360deg); } }`

import { useState } from 'react'

export default function Button({ children, variant = 'primary', isLoading = false, disabled = false, type = 'button', onClick, style }) {
  const [hovered, setHovered] = useState(false)
  const isPrimary = variant === 'primary'

  const computedStyle = {
    ...styles.base,
    ...(isPrimary ? styles.primary : styles.outline),
    ...(hovered && !disabled && !isLoading ? (isPrimary ? styles.primaryHover : styles.outlineHover) : {}),
    ...((disabled || isLoading) ? styles.disabled : {}),
    ...style,
  }

  return (
    <>
      <style>{spinKeyframe}</style>
      <button
        type={type}
        style={computedStyle}
        disabled={disabled || isLoading}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onClick}
      >
        {isLoading ? <Spinner /> : children}
      </button>
    </>
  )
}
