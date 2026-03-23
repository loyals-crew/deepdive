import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import InstallPrompt from '../InstallPrompt'

const MaskLogo = () => (
  <svg width="26" height="20" viewBox="0 0 36 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="6" width="34" height="20" rx="7" fill="white" stroke="#00B4D8" strokeWidth="2"/>
    <rect x="4" y="9" width="12" height="13" rx="4" fill="#00B4D8" opacity="0.85"/>
    <rect x="20" y="9" width="12" height="13" rx="4" fill="#00B4D8" opacity="0.85"/>
    <rect x="15" y="12" width="6" height="7" rx="3" fill="white" opacity="0.55"/>
    <rect x="11" y="1" width="14" height="7" rx="3.5" fill="white" stroke="#00B4D8" strokeWidth="1.5"/>
  </svg>
)

function useIsMobile() {
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const handler = (e) => setMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return mobile
}

const TAB_LINKS = [
  { to: '/',         end: true,  icon: '🌊', label: 'Feed'     },
  { to: '/my-dives', end: false, icon: '📔', label: 'My Dives' },
  { to: '/friends',  end: false, icon: '🤿', label: 'Friends'  },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const isMobile         = useIsMobile()

  // ── Mobile layout ────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', fontFamily: 'var(--font-main)' }}>
        {/* Slim top bar */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 1rem',
          height: '52px',
          background: 'rgba(255,255,255,0.93)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <NavLink
            to="/"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
          >
            <MaskLogo />
            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-coral)', letterSpacing: '-0.02em' }}>
              DeepDive
            </span>
          </NavLink>

          <button
            onClick={() => navigate('/log')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              padding: '0.45rem 1rem', borderRadius: '999px',
              background: 'var(--color-coral)', color: '#fff',
              fontWeight: 800, fontSize: '0.88rem',
              border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-main)',
              boxShadow: '0 3px 10px rgba(255,107,53,0.35)',
            }}
          >
            ＋ Log Dive
          </button>
        </header>

        {/* Page content — padded so bottom nav doesn't overlap */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: 'calc(60px + env(safe-area-inset-bottom))' }}>
          <Outlet />
        </main>

        {/* Bottom tab bar */}
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
          display: 'flex',
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid var(--color-border)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
          {TAB_LINKS.map(({ to, end, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={({ isActive }) => ({
                flex: 1,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: '0.15rem',
                padding: '0.5rem 0',
                textDecoration: 'none',
                color: isActive ? 'var(--color-turquoise-dark)' : '#9CABB5',
                borderTop: `2.5px solid ${isActive ? 'var(--color-turquoise-dark)' : 'transparent'}`,
                transition: 'all 0.15s',
                fontFamily: 'var(--font-main)',
              })}
            >
              <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{icon}</span>
              <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.01em' }}>{label}</span>
            </NavLink>
          ))}

          {/* Profile / sign out tab */}
          <button
            onClick={logout}
            style={{
              flex: 1,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '0.15rem',
              padding: '0.5rem 0',
              background: 'none', border: 'none',
              borderTop: '2.5px solid transparent',
              cursor: 'pointer',
              color: '#9CABB5',
              fontFamily: 'var(--font-main)',
            }}
          >
            <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>👤</span>
            <span style={{ fontSize: '0.62rem', fontWeight: 700 }}>Sign Out</span>
          </button>
        </nav>

        <InstallPrompt />
      </div>
    )
  }

  // ── Desktop layout ───────────────────────────────────────────────────────────
  const navLinkStyle = ({ isActive }) => ({
    display: 'flex', alignItems: 'center', gap: '0.3rem',
    padding: '0.35rem 0.75rem',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.9rem', fontWeight: '600',
    textDecoration: 'none',
    color: isActive ? 'var(--color-turquoise-dark)' : 'var(--color-muted)',
    background: isActive ? 'var(--color-turquoise-light)' : 'transparent',
    transition: 'all var(--transition)',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0 1.25rem', height: '60px',
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-border)',
        fontFamily: 'var(--font-main)',
      }}>
        <NavLink
          to="/"
          style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', textDecoration: 'none', marginRight: '0.5rem' }}
        >
          <MaskLogo />
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-coral)', letterSpacing: '-0.02em' }}>
            DeepDive
          </span>
        </NavLink>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem', flex: 1 }}>
          {TAB_LINKS.map(({ to, end, icon, label }) => (
            <NavLink key={to} to={to} end={end} style={navLinkStyle}>
              {icon} {label}
            </NavLink>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginLeft: 'auto' }}>
          <button
            onClick={() => navigate('/log')}
            style={{
              padding: '0.35rem 0.9rem', borderRadius: '999px',
              fontSize: '0.85rem', fontWeight: 800,
              color: '#fff', background: 'var(--color-coral)',
              border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-main)',
              boxShadow: '0 2px 8px rgba(255,107,53,0.3)',
              flexShrink: 0,
            }}
          >
            ➕ Log Dive
          </button>
          <span style={{
            fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-deep)',
            maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{user?.name}</span>
          <button
            onClick={logout}
            style={{
              padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-md)',
              fontSize: '0.82rem', fontWeight: 700,
              color: 'var(--color-coral)', background: 'var(--color-coral-light)',
              border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-main)',
            }}
          >Sign out</button>
        </div>
      </nav>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>

      <InstallPrompt />
    </div>
  )
}
