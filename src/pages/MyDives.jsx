import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { apiMyDiveLogs } from '../api/diveLogs'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VISIBILITY_ICON = {
  excellent: '🔵',
  good:      '💙',
  average:   '🟡',
  poor:      '🟠',
  very_poor: '🔴',
}

const CURRENT_ICON = {
  none:       '🪨',
  light:      '🌊',
  moderate:   '💨',
  strong:     '💪',
  very_strong:'🚨',
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const shimmerKeyframe = `
  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`

// ─── DiveLogCard ──────────────────────────────────────────────────────────────

function DiveLogCard({ log }) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)
  const animals = Array.isArray(log.animals) ? log.animals.filter((a) => a.emoji) : []

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/dive/${log.id}`)}
      style={{
        background: 'var(--color-surface)',
        border: `1.5px solid ${hovered ? 'var(--color-turquoise)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-card)',
        padding: '1rem 1.2rem',
        cursor: 'pointer',
        transition: 'all var(--transition)',
        boxShadow: hovered ? '0 6px 24px rgba(0,180,216,0.13)' : '0 2px 10px rgba(0,180,216,0.07)',
        display: 'flex', flexDirection: 'column', gap: '0.6rem',
      }}
    >
      {/* Title + date */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-deep)', margin: 0 }}>
            🤿 {log.siteName}
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-muted)', margin: '0.15rem 0 0' }}>
            {log.country} · {formatDate(log.diveDate)}
          </p>
        </div>
        {log.privacy !== 'public' && (
          <span style={{
            fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.5rem',
            borderRadius: '999px', border: '1.5px solid var(--color-border)',
            color: 'var(--color-muted)', background: 'var(--color-sand)', flexShrink: 0,
          }}>
            {log.privacy === 'friends' ? '👥 Friends' : '🔒 Private'}
          </span>
        )}
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '0.75rem 1.5rem', flexWrap: 'wrap' }}>
        {log.maxDepthM && (
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-deep)' }}>📏 {log.maxDepthM}m</span>
        )}
        {log.durationMin && (
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-deep)' }}>⏱ {log.durationMin} min</span>
        )}
        {log.visibility && VISIBILITY_ICON[log.visibility] && (
          <span style={{ fontSize: '0.82rem', color: 'var(--color-muted)' }}>{VISIBILITY_ICON[log.visibility]} Viz</span>
        )}
        {log.current && CURRENT_ICON[log.current] && (
          <span style={{ fontSize: '0.82rem', color: 'var(--color-muted)' }}>{CURRENT_ICON[log.current]} Current</span>
        )}
        {log.likeCount > 0 && (
          <span style={{ fontSize: '0.82rem', color: 'var(--color-coral)', fontWeight: 700 }}>❤️ {log.likeCount}</span>
        )}
      </div>

      {/* Animals */}
      {animals.length > 0 && (
        <div style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap' }}>
          {animals.slice(0, 10).map((a, i) => (
            <span key={i} style={{
              fontSize: '1.15rem', background: 'var(--color-turquoise-light)',
              borderRadius: '50%', width: '30px', height: '30px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }} title={a.name}>{a.emoji}</span>
          ))}
          {animals.length > 10 && (
            <span style={{
              fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-muted)',
              background: 'var(--color-border)', borderRadius: '50%',
              width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>+{animals.length - 10}</span>
          )}
        </div>
      )}
    </div>
  )
}

// ─── MyDives page ─────────────────────────────────────────────────────────────

export default function MyDives() {
  const { token } = useAuth()
  const navigate  = useNavigate()

  const [logs, setLogs]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  const loadLogs = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiMyDiveLogs(token)
      setLogs(data.logs || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { loadLogs() }, [loadLogs])

  // Group by year
  const grouped = logs.reduce((acc, log) => {
    const year = log.diveDate ? new Date(log.diveDate).getFullYear() : 'Unknown'
    if (!acc[year]) acc[year] = []
    acc[year].push(log)
    return acc
  }, {})

  const years = Object.keys(grouped).sort((a, b) => b - a)

  return (
    <>
      <style>{shimmerKeyframe}</style>
      <div style={{
        maxWidth: '680px', margin: '0 auto', padding: '2rem 1.25rem 5rem',
        display: 'flex', flexDirection: 'column', gap: '1.5rem',
        fontFamily: 'var(--font-main)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-deep)', letterSpacing: '-0.02em' }}>
              📔 My Dive Log
            </h1>
            {!loading && logs.length > 0 && (
              <p style={{ fontSize: '0.88rem', color: 'var(--color-muted)', marginTop: '0.2rem' }}>
                {logs.length} dive{logs.length !== 1 ? 's' : ''} logged
              </p>
            )}
          </div>
          <button onClick={() => navigate('/log')}
            style={{
              padding: '0.55rem 1.1rem', borderRadius: 'var(--radius-md)',
              background: 'var(--color-coral)', color: '#fff', border: 'none',
              fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer',
              fontFamily: 'var(--font-main)', boxShadow: 'var(--shadow-btn)',
              flexShrink: 0,
            }}>
            ➕ Log Dive
          </button>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem 1rem', background: 'var(--color-error-light)',
            border: '1px solid #FCA5A5', borderRadius: 'var(--radius-md)',
            color: 'var(--color-error)', fontSize: '0.875rem',
          }}>{error}</div>
        )}

        {/* Skeleton */}
        {loading && [1, 2, 3, 4].map((i) => (
          <div key={i} style={{
            height: '110px', borderRadius: 'var(--radius-card)',
            background: 'linear-gradient(90deg, var(--color-border) 25%, var(--color-turquoise-light) 50%, var(--color-border) 75%)',
            backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
          }} />
        ))}

        {/* Empty state */}
        {!loading && logs.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '4rem 1.5rem', gap: '1rem', textAlign: 'center',
          }}>
            <span style={{ fontSize: '4rem' }}>📔</span>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-deep)' }}>
              No dives logged yet!
            </h2>
            <p style={{ color: 'var(--color-muted)', maxWidth: '320px', lineHeight: 1.6 }}>
              Every dive tells a story. Start building your logbook today.
            </p>
            <button onClick={() => navigate('/log')}
              style={{
                padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)',
                background: 'var(--color-coral)', color: '#fff', border: 'none',
                fontSize: '1rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--font-main)',
                boxShadow: 'var(--shadow-btn)',
              }}>🤿 Log Your First Dive</button>
          </div>
        )}

        {/* Grouped by year */}
        {!loading && years.map((year) => (
          <div key={year} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h2 style={{
              fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-muted)',
              textTransform: 'uppercase', letterSpacing: '0.07em',
              borderBottom: '2px solid var(--color-border)', paddingBottom: '0.4rem',
            }}>{year} · {grouped[year].length} dive{grouped[year].length !== 1 ? 's' : ''}</h2>
            {grouped[year].map((log) => (
              <DiveLogCard key={log.id} log={log} />
            ))}
          </div>
        ))}
      </div>
    </>
  )
}
