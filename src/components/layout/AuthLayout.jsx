import BubbleBackground from '../ui/BubbleBackground'

const MaskLogo = () => (
  <svg width="36" height="28" viewBox="0 0 36 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="6" width="34" height="20" rx="7" fill="white" stroke="#00B4D8" strokeWidth="2"/>
    <rect x="4" y="9" width="12" height="13" rx="4" fill="#00B4D8" opacity="0.85"/>
    <rect x="20" y="9" width="12" height="13" rx="4" fill="#00B4D8" opacity="0.85"/>
    <rect x="15" y="12" width="6" height="7" rx="3" fill="white" opacity="0.55"/>
    <rect x="11" y="1" width="14" height="7" rx="3.5" fill="white" stroke="#00B4D8" strokeWidth="1.5"/>
  </svg>
)

export default function AuthLayout({ children }) {
  const wrapStyle = {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
    position: 'relative',
  }

  const cardStyle = {
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: 'var(--radius-card)',
    boxShadow: 'var(--shadow-card)',
    padding: '2.5rem 2rem',
    width: '100%',
    maxWidth: '420px',
    position: 'relative',
    zIndex: 1,
    border: '1px solid rgba(255,255,255,0.7)',
  }

  const logoRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    marginBottom: '2rem',
    justifyContent: 'center',
  }

  const logoTextStyle = {
    fontSize: '1.6rem',
    fontWeight: '800',
    color: 'var(--color-coral)',
    letterSpacing: '-0.02em',
  }

  const taglineStyle = {
    textAlign: 'center',
    fontSize: '0.8rem',
    color: 'var(--color-muted)',
    marginTop: '2rem',
    fontWeight: '500',
  }

  return (
    <div style={wrapStyle}>
      <BubbleBackground />
      <div style={cardStyle}>
        <div style={logoRowStyle}>
          <MaskLogo />
          <span style={logoTextStyle}>DeepDive</span>
        </div>
        {children}
        <p style={taglineStyle}>Dive deeper. Connect wider.</p>
      </div>
    </div>
  )
}
