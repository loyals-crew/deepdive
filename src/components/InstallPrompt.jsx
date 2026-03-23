import { useState, useEffect } from 'react'

const STORAGE_KEY = 'deepdive_install_dismissed_v1'

function isIOS() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream
}

function isInstalled() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showIOS, setShowIOS]               = useState(false)
  const [visible, setVisible]               = useState(false)

  useEffect(() => {
    if (isInstalled()) return
    if (localStorage.getItem(STORAGE_KEY)) return

    if (isIOS()) {
      const t = setTimeout(() => { setShowIOS(true); setVisible(true) }, 4000)
      return () => clearTimeout(t)
    }

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismiss = () => {
    setVisible(false)
    localStorage.setItem(STORAGE_KEY, '1')
  }

  const install = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    if (outcome === 'accepted') setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(68px + env(safe-area-inset-bottom))',
      left: '0.75rem',
      right: '0.75rem',
      background: '#fff',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0,60,80,0.18)',
      padding: '1rem 1.1rem',
      zIndex: 500,
      border: '1.5px solid var(--color-turquoise-light)',
      fontFamily: 'var(--font-main)',
      animation: 'slideUp 0.3s ease',
    }}>
      <style>{`@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        {/* Icon */}
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
          background: 'linear-gradient(135deg, #00B4D8, #0077B6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem',
        }}>🤿</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, color: 'var(--color-deep)', fontSize: '0.95rem' }}>
            Add DeepDive to Home Screen
          </div>
          {showIOS ? (
            <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginTop: '0.25rem', lineHeight: 1.4 }}>
              Tap <strong style={{ color: 'var(--color-deep)' }}>Share</strong>{' '}
              <span style={{ fontSize: '0.9rem' }}>⎙</span> then{' '}
              <strong style={{ color: 'var(--color-deep)' }}>Add to Home Screen</strong>
            </div>
          ) : (
            <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginTop: '0.25rem' }}>
              Install for fast access — no App Store needed
            </div>
          )}
        </div>

        <button
          onClick={dismiss}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '1.1rem', color: 'var(--color-muted)', padding: '0.1rem',
            lineHeight: 1, flexShrink: 0,
          }}
          aria-label="Dismiss"
        >✕</button>
      </div>

      {!showIOS && (
        <button
          onClick={install}
          style={{
            marginTop: '0.85rem', width: '100%',
            padding: '0.65rem', borderRadius: 'var(--radius-md)',
            background: 'var(--color-coral)', color: '#fff',
            fontWeight: 800, fontSize: '0.92rem', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-main)',
            boxShadow: '0 3px 10px rgba(255,107,53,0.35)',
          }}
        >
          Install App
        </button>
      )}
    </div>
  )
}
