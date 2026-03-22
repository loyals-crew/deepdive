import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const MaskLogo = () => (
  <svg width="28" height="22" viewBox="0 0 36 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="6" width="34" height="20" rx="7" fill="white" stroke="#00B4D8" strokeWidth="2"/>
    <rect x="4" y="9" width="12" height="13" rx="4" fill="#00B4D8" opacity="0.85"/>
    <rect x="20" y="9" width="12" height="13" rx="4" fill="#00B4D8" opacity="0.85"/>
    <rect x="15" y="12" width="6" height="7" rx="3" fill="white" opacity="0.55"/>
    <rect x="11" y="1" width="14" height="7" rx="3.5" fill="white" stroke="#00B4D8" strokeWidth="1.5"/>
  </svg>
)

export default function AppLayout() {
  const { user, logout } = useAuth()

  const navStyle = {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0 1.25rem',
    height: '60px',
    background: 'rgba(255,255,255,0.88)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--color-border)',
    fontFamily: 'var(--font-main)',
  }

  const logoLinkStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
    textDecoration: 'none',
    marginRight: '0.5rem',
  }

  const logoTextStyle = {
    fontSize: '1.2rem',
    fontWeight: '800',
    color: 'var(--color-coral)',
    letterSpacing: '-0.02em',
  }

  const navLinksStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.15rem',
    flex: 1,
  }

  const userSectionStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    marginLeft: 'auto',
  }

  const userNameStyle = {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: 'var(--color-deep)',
    maxWidth: '130px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }

  const logoutBtnStyle = {
    padding: '0.3rem 0.75rem',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.82rem',
    fontWeight: '700',
    color: 'var(--color-coral)',
    background: 'var(--color-coral-light)',
    border: 'none',
    cursor: 'pointer',
    transition: 'background var(--transition)',
    fontFamily: 'var(--font-main)',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <nav style={navStyle}>
        <NavLink to="/" style={logoLinkStyle}>
          <MaskLogo />
          <span style={logoTextStyle}>DeepDive</span>
        </NavLink>

        <div style={navLinksStyle}>
          <NavLink
            to="/"
            end
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.9rem',
              fontWeight: '600',
              textDecoration: 'none',
              color: isActive ? 'var(--color-turquoise-dark)' : 'var(--color-muted)',
              background: isActive ? 'var(--color-turquoise-light)' : 'transparent',
              transition: 'all var(--transition)',
            })}
          >
            🏠 Home
          </NavLink>
          <NavLink
            to="/friends"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.9rem',
              fontWeight: '600',
              textDecoration: 'none',
              color: isActive ? 'var(--color-turquoise-dark)' : 'var(--color-muted)',
              background: isActive ? 'var(--color-turquoise-light)' : 'transparent',
              transition: 'all var(--transition)',
            })}
          >
            🤿 Friends
          </NavLink>
        </div>

        <div style={userSectionStyle}>
          <span style={userNameStyle}>{user?.name}</span>
          <button style={logoutBtnStyle} onClick={logout}>Sign out</button>
        </div>
      </nav>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
    </div>
  )
}
