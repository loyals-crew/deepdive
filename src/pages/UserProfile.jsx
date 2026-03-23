import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { apiUserDiveLogs } from '../api/diveLogs'

const LEVEL_LABEL = {
  beginner:     '🐠 Beginner',
  intermediate: '🐙 Intermediate',
  advanced:     '🦈 Advanced',
}

const VISIBILITY_ICON = {
  excellent: '👁 Excellent',
  good:      '👁 Good',
  average:   '👁 Average',
  poor:      '👁 Poor',
  very_poor: '👁 Very Poor',
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30)  return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

function DiveLogCard({ log, onClick }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '1rem 1.1rem',
        borderRadius: 'var(--radius-md)',
        background: hovered ? '#FAFEFF' : 'var(--color-surface)',
        border: `1.5px solid ${hovered ? 'var(--color-turquoise)' : 'var(--color-border)'}`,
        boxShadow: hovered ? '0 4px 16px rgba(0,180,216,0.12)' : '0 2px 8px rgba(0,180,216,0.06)',
        cursor: 'pointer',
        transition: 'all var(--transition)',
        fontFamily: 'var(--font-main)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {log.title && (
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-turquoise-dark)', marginBottom: '0.15rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {log.title}
            </div>
          )}
          <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-deep)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {log.siteName}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-muted)', marginTop: '0.1rem' }}>
            {log.country} · {new Date(log.diveDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem', flexShrink: 0 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>{timeAgo(log.createdAt)}</span>
          {log.privacy !== 'public' && (
            <span style={{
              fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.4rem',
              borderRadius: '999px', background: 'var(--color-turquoise-light)',
              color: 'var(--color-turquoise-dark)',
            }}>
              {log.privacy === 'friends' ? '👥 Friends' : '🔒 Private'}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.6rem', fontSize: '0.82rem', color: 'var(--color-muted)', flexWrap: 'wrap' }}>
        {log.maxDepthM  && <span>📏 {log.maxDepthM}m</span>}
        {log.durationMin && <span>⏱ {log.durationMin} min</span>}
        {log.visibility && <span>{VISIBILITY_ICON[log.visibility] ?? log.visibility}</span>}
        {log.likeCount > 0 && <span>❤️ {log.likeCount}</span>}
      </div>

      {log.animals?.length > 0 && (
        <div style={{ marginTop: '0.5rem', fontSize: '1.1rem', lineHeight: 1 }}>
          {log.animals.slice(0, 10).map((a, i) => (
            <span key={i} title={a.name}>{a.emoji}</span>
          ))}
          {log.animals.length > 10 && (
            <span style={{ fontSize: '0.72rem', color: 'var(--color-muted)', marginLeft: '0.3rem' }}>+{log.animals.length - 10}</span>
          )}
        </div>
      )}
    </div>
  )
}

export default function UserProfile() {
  const { id }     = useParams()
  const { token }  = useAuth()
  const navigate   = useNavigate()

  const [logs, setLogs]           = useState([])
  const [profile, setProfile]     = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')

  useEffect(() => {
    if (!token || !id) return
    setLoading(true)
    apiUserDiveLogs(token, id)
      .then(({ logs, profileUser }) => {
        setLogs(logs || [])
        setProfile(profileUser)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [token, id])

  const initials = profile?.fullName
    ?.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') ?? '?'

  // Group logs by year
  const byYear = logs.reduce((acc, log) => {
    const yr = new Date(log.diveDate).getFullYear()
    if (!acc[yr]) acc[yr] = []
    acc[yr].push(log)
    return acc
  }, {})
  const years = Object.keys(byYear).sort((a, b) => b - a)

  return (
    <div style={{
      maxWidth: '640px', margin: '0 auto', padding: '1.5rem 1.25rem 4rem',
      fontFamily: 'var(--font-main)',
    }}>
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-muted)',
          display: 'flex', alignItems: 'center', gap: '0.35rem',
          padding: 0, marginBottom: '1.25rem', fontFamily: 'var(--font-main)',
        }}
      >
        ← Back
      </button>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{
              height: '90px', borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(90deg, #f0f8ff 25%, #e0f4fc 50%, #f0f8ff 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.4s infinite',
            }} />
          ))}
          <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
        </div>
      )}

      {error && (
        <div style={{ padding: '1rem', background: '#FEF2F2', borderRadius: 'var(--radius-md)', color: 'var(--color-error)' }}>
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Profile header */}
          {profile && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              padding: '1.25rem 1.5rem',
              background: 'linear-gradient(135deg, #e0f7ff 0%, #f0fdff 100%)',
              borderRadius: 'var(--radius-card)',
              border: '1.5px solid var(--color-turquoise-light)',
              marginBottom: '1.5rem',
            }}>
              <div style={{
                width: '60px', height: '60px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-turquoise) 0%, #90E0EF 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.4rem', fontWeight: 800, color: '#fff', flexShrink: 0,
                boxShadow: '0 4px 12px rgba(0,180,216,0.3)',
              }}>
                {initials}
              </div>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-deep)', margin: 0 }}>
                  {profile.fullName}
                </h1>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginTop: '0.2rem' }}>
                  {LEVEL_LABEL[profile.experienceLevel] ?? profile.experienceLevel}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-turquoise-dark)' }}>
                  {logs.length}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: 600 }}>
                  {logs.length === 1 ? 'dive' : 'dives'}
                </div>
              </div>
            </div>
          )}

          {/* Dive logs */}
          {logs.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '3rem 1.5rem',
              color: 'var(--color-muted)', fontSize: '0.95rem',
            }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '0.75rem' }}>🌊</span>
              No dives to show yet.
            </div>
          ) : (
            years.map((yr) => (
              <div key={yr} style={{ marginBottom: '1.75rem' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem',
                }}>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-deep)' }}>{yr}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: 600 }}>
                    {byYear[yr].length} {byYear[yr].length === 1 ? 'dive' : 'dives'}
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {byYear[yr].map((log) => (
                    <DiveLogCard
                      key={log.id}
                      log={log}
                      onClick={() => navigate(`/dive/${log.id}`)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  )
}
