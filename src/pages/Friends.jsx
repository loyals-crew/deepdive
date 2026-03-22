import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/ui/Button'
import {
  apiFriendsList,
  apiUsersSearch,
  apiFriendRequest,
  apiFriendRespond,
} from '../api/friends'

// ─── Constants ────────────────────────────────────────────────────────────────

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
`

// ─── UserCard ─────────────────────────────────────────────────────────────────

function UserCard({ user, mode, mutualCount, friendshipId, onAction, loading }) {
  const [hovered, setHovered] = useState(false)

  const cardStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    padding: '0.85rem 1rem',
    borderRadius: 'var(--radius-md)',
    background: hovered ? '#FAFEFF' : 'var(--color-surface)',
    border: `1.5px solid ${hovered ? 'var(--color-turquoise)' : 'var(--color-border)'}`,
    boxShadow: hovered ? '0 4px 16px rgba(0,180,216,0.12)' : '0 2px 8px rgba(0,180,216,0.06)',
    transition: 'all var(--transition)',
  }

  const avatarStyle = {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--color-turquoise-light) 0%, #90E0EF 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
    fontWeight: '800',
    color: 'var(--color-turquoise-dark)',
    flexShrink: 0,
    border: '2px solid var(--color-border)',
  }

  const initials = user.fullName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  const renderAction = () => {
    if (mode === 'friend') {
      return (
        <span style={{
          fontSize: '0.78rem', fontWeight: '700',
          color: 'var(--color-success)', background: '#F0FFF4',
          border: '1.5px solid #9AE6B4', borderRadius: 'var(--radius-md)',
          padding: '0.3rem 0.7rem', flexShrink: 0,
        }}>✓ Crew</span>
      )
    }

    if (mode === 'pending') {
      return (
        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
          <Button
            variant="primary"
            style={{ width: 'auto', padding: '0.3rem 0.75rem', fontSize: '0.82rem', boxShadow: 'none' }}
            isLoading={loading}
            onClick={() => onAction('accept', { friendshipId })}
          >Accept</Button>
          <Button
            variant="outline"
            style={{ width: 'auto', padding: '0.3rem 0.75rem', fontSize: '0.82rem' }}
            disabled={loading}
            onClick={() => onAction('decline', { friendshipId })}
          >Decline</Button>
        </div>
      )
    }

    const status = user.connectionStatus
    if (status === 'pending_sent') {
      return (
        <span style={{
          fontSize: '0.78rem', fontWeight: '700', color: 'var(--color-muted)',
          background: 'var(--color-turquoise-light)', border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', padding: '0.3rem 0.7rem', flexShrink: 0,
        }}>Requested</span>
      )
    }
    if (status === 'accepted') {
      return (
        <span style={{
          fontSize: '0.78rem', fontWeight: '700', color: 'var(--color-success)',
          background: '#F0FFF4', border: '1.5px solid #9AE6B4',
          borderRadius: 'var(--radius-md)', padding: '0.3rem 0.7rem', flexShrink: 0,
        }}>✓ Crew</span>
      )
    }
    if (status === 'pending_received') {
      return (
        <span style={{
          fontSize: '0.78rem', fontWeight: '700', color: 'var(--color-turquoise-dark)',
          borderRadius: 'var(--radius-md)', padding: '0.3rem 0.7rem', flexShrink: 0,
        }}>↑ Respond</span>
      )
    }

    return (
      <Button
        variant="outline"
        style={{ width: 'auto', padding: '0.3rem 0.75rem', fontSize: '0.82rem', flexShrink: 0 }}
        isLoading={loading}
        onClick={() => onAction('request', { userId: user.id })}
      >+ Add</Button>
    )
  }

  return (
    <div
      style={cardStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={avatarStyle}>{initials}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.95rem', fontWeight: '700', color: 'var(--color-deep)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{user.fullName}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--color-muted)', marginTop: '0.1rem' }}>
          {LEVEL_LABEL[user.experienceLevel] ?? user.experienceLevel}
        </div>
        {mode === 'recommendation' && mutualCount > 0 && (
          <span style={{
            display: 'inline-block', marginTop: '0.2rem',
            fontSize: '0.72rem', fontWeight: '700',
            color: 'var(--color-turquoise-dark)', background: 'var(--color-turquoise-light)',
            borderRadius: '0.4rem', padding: '0.1rem 0.45rem',
          }}>
            {mutualCount} mutual {mutualCount === 1 ? 'friend' : 'friends'}
          </span>
        )}
      </div>
      {renderAction()}
    </div>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({ title, children, isEmpty, emptyText }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      <h2 style={{
        fontSize: '1rem', fontWeight: '800', color: 'var(--color-deep)',
        letterSpacing: '-0.01em',
      }}>{title}</h2>
      {isEmpty
        ? <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', padding: '0.5rem 0' }}>{emptyText}</p>
        : children}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCards({ count = 3 }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={{
          height: '68px', borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(90deg, var(--color-border) 25%, var(--color-turquoise-light) 50%, var(--color-border) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.4s infinite',
        }} />
      ))}
    </>
  )
}

// ─── Friends page ─────────────────────────────────────────────────────────────

export default function Friends() {
  const { token } = useAuth()

  const [friends, setFriends]             = useState([])
  const [pending, setPending]             = useState([])
  const [recommendations, setRecs]        = useState([])
  const [pageLoading, setPageLoading]     = useState(true)
  const [pageError, setPageError]         = useState('')

  const [searchQuery, setSearchQuery]     = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)

  const [actionLoading, setActionLoading] = useState({})

  const debounceRef = useRef(null)

  // ── Load page data ───────────────────────────────────────────────────────────

  const loadFriendsData = useCallback(async () => {
    setPageLoading(true)
    setPageError('')
    try {
      const data = await apiFriendsList(token)
      setFriends(data.friends)
      setPending(data.pending)
      setRecs(data.recommendations)
    } catch (err) {
      setPageError(err.message)
    } finally {
      setPageLoading(false)
    }
  }, [token])

  useEffect(() => { loadFriendsData() }, [loadFriendsData])

  // ── Debounced search ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = searchQuery.trim()
    if (trimmed.length < 2) { setSearchResults([]); setSearchLoading(false); return }

    setSearchLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await apiUsersSearch(token, trimmed)
        setSearchResults(data.users)
      } catch {
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 300)

    return () => clearTimeout(debounceRef.current)
  }, [searchQuery, token])

  // ── Action handler ───────────────────────────────────────────────────────────

  const handleAction = useCallback(async (type, payload) => {
    const key = payload.friendshipId ?? payload.userId
    setActionLoading((prev) => ({ ...prev, [key]: true }))
    try {
      if (type === 'request') {
        await apiFriendRequest(token, payload.userId)
        const patch = (arr) => arr.map((u) =>
          u.id === payload.userId ? { ...u, connectionStatus: 'pending_sent' } : u
        )
        setSearchResults(patch)
        setRecs(patch)
      } else if (type === 'accept') {
        await apiFriendRespond(token, payload.friendshipId, 'accept')
        await loadFriendsData()
      } else if (type === 'decline') {
        await apiFriendRespond(token, payload.friendshipId, 'decline')
        setPending((prev) => prev.filter((p) => p.friendshipId !== payload.friendshipId))
      }
    } catch (err) {
      console.error(`Action ${type} failed:`, err.message)
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }))
    }
  }, [token, loadFriendsData])

  // ── Styles ───────────────────────────────────────────────────────────────────

  const pageStyle = {
    maxWidth: '680px',
    margin: '0 auto',
    padding: '2rem 1.25rem 5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '2.25rem',
    fontFamily: 'var(--font-main)',
    width: '100%',
  }

  const searchInputStyle = {
    width: '100%',
    padding: '0.85rem 1rem 0.85rem 2.75rem',
    borderRadius: 'var(--radius-md)',
    border: '2px solid var(--color-border)',
    fontSize: '1rem',
    fontFamily: 'var(--font-main)',
    color: 'var(--color-deep)',
    background: 'var(--color-surface)',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color var(--transition), box-shadow var(--transition)',
  }

  const searchFocusStyle = `
    input.deepdive-search:focus {
      border-color: var(--color-turquoise);
      box-shadow: 0 0 0 3px rgba(0,180,216,0.15);
    }
  `

  if (pageError) {
    return (
      <div style={pageStyle}>
        <div style={{
          padding: '0.75rem 1rem', background: 'var(--color-error-light)',
          border: '1px solid #FCA5A5', borderRadius: 'var(--radius-md)',
          color: 'var(--color-error)', fontSize: '0.875rem',
        }}>Failed to load: {pageError}</div>
      </div>
    )
  }

  return (
    <>
      <style>{shimmerKeyframe}{searchFocusStyle}</style>
      <div style={pageStyle}>

        {/* Header */}
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--color-deep)', letterSpacing: '-0.02em' }}>
            Your Dive Crew
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-muted)', marginTop: '0.25rem' }}>
            Find divers, manage requests, explore your network.
          </p>
        </div>

        {/* ── Search ──────────────────────────────────────────────────────────── */}
        <div>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: '0.875rem', top: '50%',
              transform: 'translateY(-50%)', pointerEvents: 'none', lineHeight: 1,
            }}>🔍</span>
            <input
              type="search"
              className="deepdive-search"
              placeholder="Search divers by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={searchInputStyle}
            />
          </div>

          {searchQuery.trim().length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
              {searchLoading && <SkeletonCards count={2} />}
              {!searchLoading && searchQuery.trim().length < 2 && (
                <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>
                  Type at least 2 characters to search
                </p>
              )}
              {!searchLoading && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>
                  No divers found for &ldquo;{searchQuery}&rdquo;
                </p>
              )}
              {!searchLoading && searchResults.map((u) => (
                <UserCard
                  key={u.id} user={u} mode="search"
                  onAction={handleAction} loading={!!actionLoading[u.id]}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── People You May Know ──────────────────────────────────────────────── */}
        {pageLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ height: '22px', width: '200px', borderRadius: '0.4rem', background: 'var(--color-border)' }} />
            <SkeletonCards count={3} />
          </div>
        ) : (
          <Section
            title="🤝 People You May Know"
            isEmpty={recommendations.length === 0}
            emptyText="No recommendations yet — grow your crew and we'll suggest divers you might know!"
          >
            {recommendations.map((u) => (
              <UserCard
                key={u.id}
                user={{ ...u, connectionStatus: u.connectionStatus ?? 'none' }}
                mode="recommendation"
                mutualCount={u.mutualCount}
                onAction={handleAction}
                loading={!!actionLoading[u.id]}
              />
            ))}
          </Section>
        )}

        {/* ── Pending Requests ─────────────────────────────────────────────────── */}
        {!pageLoading && pending.length > 0 && (
          <Section title={`⏳ Pending Requests (${pending.length})`} isEmpty={false}>
            {pending.map((p) => (
              <UserCard
                key={p.friendshipId}
                user={{ id: p.userId, fullName: p.fullName, experienceLevel: p.experienceLevel }}
                mode="pending"
                friendshipId={p.friendshipId}
                onAction={handleAction}
                loading={!!actionLoading[p.friendshipId]}
              />
            ))}
          </Section>
        )}

        {/* ── Your Dive Crew ───────────────────────────────────────────────────── */}
        {pageLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ height: '22px', width: '160px', borderRadius: '0.4rem', background: 'var(--color-border)' }} />
            <SkeletonCards count={4} />
          </div>
        ) : (
          <Section
            title={`🪸 Your Dive Crew${friends.length > 0 ? ` (${friends.length})` : ''}`}
            isEmpty={friends.length === 0}
            emptyText="Your crew is empty — search for divers and send some requests!"
          >
            {friends.map((f) => (
              <UserCard key={f.id} user={f} mode="friend" onAction={handleAction} loading={false} />
            ))}
          </Section>
        )}

      </div>
    </>
  )
}
