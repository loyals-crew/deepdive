import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { apiFeedList, apiToggleLike } from '../api/diveLogs'

// ─── Constants ─────────────────────────────────────────────────────────────────

const VISIBILITY_LABEL = {
  excellent: { label: 'Excellent', icon: '🔵' },
  good:      { label: 'Good',      icon: '💙' },
  average:   { label: 'Average',   icon: '🟡' },
  poor:      { label: 'Poor',      icon: '🟠' },
  very_poor: { label: 'Very Poor', icon: '🔴' },
}

const CURRENT_LABEL = {
  none:       { label: 'No current',     icon: '🪨' },
  light:      { label: 'Light current',  icon: '🌊' },
  moderate:   { label: 'Moderate',       icon: '💨' },
  strong:     { label: 'Strong',         icon: '💪' },
  very_strong:{ label: 'Surge',          icon: '🚨' },
}

const LEVEL_LABEL = {
  beginner:     '🐠 Beginner',
  intermediate: '🐙 Intermediate',
  advanced:     '🦈 Advanced',
}

const shimmerKeyframe = `
  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  @keyframes heartBeat {
    0%   { transform: scale(1); }
    30%  { transform: scale(1.25); }
    60%  { transform: scale(0.95); }
    100% { transform: scale(1); }
  }
`

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── DiveCard ─────────────────────────────────────────────────────────────────

function DiveCard({ log, onLike, likeLoading, currentUserId }) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)
  const initials = (log.authorName || '?').split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
  const emojis   = Array.isArray(log.animalEmojis) ? log.animalEmojis.filter(Boolean) : []

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--color-surface)',
        border: `1.5px solid ${hovered ? 'var(--color-turquoise)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-card)',
        padding: '1.1rem 1.25rem',
        boxShadow: hovered ? '0 6px 24px rgba(0,180,216,0.13)' : '0 2px 10px rgba(0,180,216,0.07)',
        cursor: 'pointer',
        transition: 'all var(--transition)',
      }}
      onClick={() => navigate(`/dive/${log.id}`)}
    >
      {/* Author header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--color-turquoise-light), #90E0EF)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-turquoise-dark)',
          border: '2px solid var(--color-border)',
        }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-deep)' }}>
            {log.authorName}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-muted)' }}>
            {LEVEL_LABEL[log.authorLevel] ?? log.authorLevel} · {formatDate(log.diveDate)}
          </div>
        </div>
      </div>

      {/* Site + Country */}
      <h3 style={{
        fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-deep)',
        marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem',
      }}>
        🤿 {log.siteName}
        <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-muted)' }}>· {log.country}</span>
      </h3>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
        {log.maxDepthM && (
          <span style={{ fontSize: '0.82rem', color: 'var(--color-deep)', fontWeight: 700 }}>
            📏 {log.maxDepthM}m
          </span>
        )}
        {log.durationMin && (
          <span style={{ fontSize: '0.82rem', color: 'var(--color-deep)', fontWeight: 700 }}>
            ⏱ {log.durationMin} min
          </span>
        )}
        {log.visibility && VISIBILITY_LABEL[log.visibility] && (
          <span style={{ fontSize: '0.82rem', color: 'var(--color-muted)' }}>
            {VISIBILITY_LABEL[log.visibility].icon} {VISIBILITY_LABEL[log.visibility].label} viz
          </span>
        )}
        {log.current && CURRENT_LABEL[log.current] && (
          <span style={{ fontSize: '0.82rem', color: 'var(--color-muted)' }}>
            {CURRENT_LABEL[log.current].icon} {CURRENT_LABEL[log.current].label}
          </span>
        )}
      </div>

      {/* Animals */}
      {emojis.length > 0 && (
        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          {emojis.slice(0, 8).map((e, i) => (
            <span key={i} style={{
              fontSize: '1.3rem', background: 'var(--color-turquoise-light)',
              borderRadius: '50%', width: '34px', height: '34px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{e}</span>
          ))}
          {emojis.length > 8 && (
            <span style={{
              fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-muted)',
              background: 'var(--color-border)', borderRadius: '50%',
              width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>+{emojis.length - 8}</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}
        onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => onLike(log.id)}
          disabled={likeLoading}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            color: log.likedByMe ? 'var(--color-coral)' : 'var(--color-muted)',
            fontSize: '0.9rem', fontWeight: 700, fontFamily: 'var(--font-main)',
            padding: '0.25rem 0',
            animation: likeLoading ? 'none' : 'inherit',
          }}>
          <span style={{
            fontSize: '1.1rem',
            display: 'inline-block',
            animation: log.likedByMe ? 'heartBeat 0.4s ease' : 'none',
          }}>{log.likedByMe ? '❤️' : '🤍'}</span>
          {log.likeCount > 0 && <span>{log.likeCount}</span>}
        </button>

        <button
          type="button"
          onClick={() => navigate(`/dive/${log.id}#comments`)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            color: 'var(--color-muted)', fontSize: '0.9rem', fontWeight: 700,
            fontFamily: 'var(--font-main)', padding: '0.25rem 0',
          }}>
          💬 {log.commentCount > 0 ? log.commentCount : 'Comment'}
        </button>

        <button
          type="button"
          onClick={() => navigate(`/dive/${log.id}`)}
          style={{
            marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-turquoise-dark)', fontSize: '0.82rem', fontWeight: 700,
            fontFamily: 'var(--font-main)', padding: '0.25rem 0',
          }}>
          View dive →
        </button>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div style={{
      height: '160px', borderRadius: 'var(--radius-card)',
      background: 'linear-gradient(90deg, var(--color-border) 25%, var(--color-turquoise-light) 50%, var(--color-border) 75%)',
      backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
    }} />
  )
}

// ─── Feed page ────────────────────────────────────────────────────────────────

export default function Feed() {
  const { token, user } = useAuth()
  const navigate = useNavigate()

  const [feed, setFeed]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [likeLoading, setLikeLoading] = useState({})

  const loadFeed = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiFeedList(token)
      setFeed(data.feed)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { loadFeed() }, [loadFeed])

  const handleLike = async (logId) => {
    setLikeLoading((prev) => ({ ...prev, [logId]: true }))
    // Optimistic update
    setFeed((prev) => prev.map((l) =>
      l.id === logId
        ? {
            ...l,
            likedByMe: !l.likedByMe,
            likeCount: l.likedByMe ? l.likeCount - 1 : l.likeCount + 1,
          }
        : l
    ))
    try {
      await apiToggleLike(token, logId)
    } catch {
      // Revert on error
      setFeed((prev) => prev.map((l) =>
        l.id === logId
          ? {
              ...l,
              likedByMe: !l.likedByMe,
              likeCount: l.likedByMe ? l.likeCount - 1 : l.likeCount + 1,
            }
          : l
      ))
    } finally {
      setLikeLoading((prev) => ({ ...prev, [logId]: false }))
    }
  }

  return (
    <>
      <style>{shimmerKeyframe}</style>
      <div style={{
        maxWidth: '680px', margin: '0 auto', padding: '2rem 1.25rem 5rem',
        display: 'flex', flexDirection: 'column', gap: '1.25rem',
        fontFamily: 'var(--font-main)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-deep)', letterSpacing: '-0.02em' }}>
              🌊 Dive Feed
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-muted)', marginTop: '0.2rem' }}>
              Dives from your crew and their connections.
            </p>
          </div>
          <button onClick={() => navigate('/log')}
            style={{
              padding: '0.55rem 1.1rem', borderRadius: 'var(--radius-md)',
              background: 'var(--color-coral)', color: '#fff', border: 'none',
              fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer',
              fontFamily: 'var(--font-main)', boxShadow: 'var(--shadow-btn)',
              flexShrink: 0,
            }}>
            🤿 Log Dive
          </button>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem 1rem', background: 'var(--color-error-light)',
            border: '1px solid #FCA5A5', borderRadius: 'var(--radius-md)',
            color: 'var(--color-error)', fontSize: '0.875rem',
          }}>{error}</div>
        )}

        {loading && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {!loading && feed.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '4rem 1.5rem', gap: '1rem', textAlign: 'center',
          }}>
            <span style={{ fontSize: '4rem' }}>🤿</span>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-deep)' }}>
              The feed is empty!
            </h2>
            <p style={{ color: 'var(--color-muted)', maxWidth: '360px', lineHeight: 1.6 }}>
              Add friends and start logging dives to see what your crew is up to.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button onClick={() => navigate('/log')}
                style={{
                  padding: '0.65rem 1.25rem', borderRadius: 'var(--radius-md)',
                  background: 'var(--color-coral)', color: '#fff', border: 'none',
                  fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--font-main)',
                  boxShadow: 'var(--shadow-btn)',
                }}>🤿 Log Your First Dive</button>
              <button onClick={() => navigate('/friends')}
                style={{
                  padding: '0.65rem 1.25rem', borderRadius: 'var(--radius-md)',
                  background: 'var(--color-surface)', color: 'var(--color-turquoise-dark)',
                  border: '2px solid var(--color-turquoise)', fontSize: '0.95rem',
                  fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--font-main)',
                }}>👥 Find Divers</button>
            </div>
          </div>
        )}

        {!loading && feed.map((log) => (
          <DiveCard
            key={log.id}
            log={log}
            onLike={handleLike}
            likeLoading={!!likeLoading[log.id]}
            currentUserId={user?.sub}
          />
        ))}
      </div>
    </>
  )
}
