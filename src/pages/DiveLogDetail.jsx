import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  apiDiveLogDetail,
  apiToggleLike,
  apiGetComments,
  apiAddComment,
  apiDeleteComment,
} from '../api/diveLogs'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function timeAgo(d) {
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

const VISIBILITY_INFO = {
  excellent: { label: 'Excellent 20m+',  icon: '🔵', color: '#0077B6' },
  good:      { label: 'Good 10-20m',     icon: '💙', color: '#0096C7' },
  average:   { label: 'Average 5-10m',   icon: '🟡', color: '#52B69A' },
  poor:      { label: 'Poor 2-5m',       icon: '🟠', color: '#B5838D' },
  very_poor: { label: 'Very Poor <2m',   icon: '🔴', color: '#6D6875' },
}

const CURRENT_INFO = {
  none:       '🪨 No current',
  light:      '🌊 Light drift',
  moderate:   '💨 Moderate',
  strong:     '💪 Strong',
  very_strong:'🚨 Very strong',
}

const WETSUIT_INFO = {
  none:     '🩱 No suit',
  shorty:   '👙 Shorty',
  '3mm':    '🤿 3mm',
  '5mm':    '🤿 5mm',
  '7mm':    '🤿 7mm',
  semi_dry: '💧 Semi-dry',
  dry_suit: '❄️ Drysuit',
}

const GAS_INFO = {
  air:           '🌬️ Air (21%)',
  nitrox32:      '⚗️ EANx 32',
  nitrox36:      '⚗️ EANx 36',
  nitrox40:      '⚗️ EANx 40',
  nitrox_custom: '⚗️ Custom Nitrox',
  trimix:        '🧪 Trimix',
  rebreather:    '♻️ Rebreather',
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

// ─── Section card ─────────────────────────────────────────────────────────────

function InfoSection({ title, children }) {
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
      borderRadius: 'var(--radius-card)', padding: '1.1rem 1.25rem',
    }}>
      <h2 style={{
        fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-muted)',
        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.9rem',
      }}>{title}</h2>
      {children}
    </div>
  )
}

function StatRow({ items }) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem 2rem', flexWrap: 'wrap' }}>
      {items.filter(([, v]) => v !== null && v !== undefined && v !== '').map(([label, value]) => (
        <div key={label}>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-deep)' }}>{value}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Comments ─────────────────────────────────────────────────────────────────

function Comment({ comment, onReply, onDelete, currentUserId }) {
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [replyText, setReplyText]           = useState('')
  const [submitting, setSubmitting]         = useState(false)

  const handleReply = async () => {
    if (!replyText.trim()) return
    setSubmitting(true)
    await onReply(comment.id, replyText.trim())
    setReplyText('')
    setShowReplyInput(false)
    setSubmitting(false)
  }

  const isOwn = comment.userId === currentUserId

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <div style={{ display: 'flex', gap: '0.65rem' }}>
        {/* Avatar */}
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--color-turquoise-light), #90E0EF)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-turquoise-dark)',
          border: '2px solid var(--color-border)',
        }}>
          {(comment.authorName || '?').split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            background: 'var(--color-sand)', borderRadius: '0 var(--radius-md) var(--radius-md) var(--radius-md)',
            padding: '0.55rem 0.85rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-deep)' }}>{comment.authorName}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-muted)' }}>{timeAgo(comment.createdAt)}</span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-deep)', lineHeight: 1.5, margin: 0 }}>{comment.body}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', paddingLeft: '0.25rem' }}>
            <button type="button" onClick={() => setShowReplyInput((v) => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-muted)', fontFamily: 'var(--font-main)', padding: 0 }}>
              Reply
            </button>
            {isOwn && (
              <button type="button" onClick={() => onDelete(comment.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-error)', fontFamily: 'var(--font-main)', padding: 0 }}>
                Delete
              </button>
            )}
          </div>

          {/* Reply input */}
          {showReplyInput && (
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleReply()}
                placeholder="Write a reply..."
                autoFocus
                style={{
                  flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.88rem',
                  border: '2px solid var(--color-turquoise)', borderRadius: 'var(--radius-md)',
                  fontFamily: 'var(--font-main)', outline: 'none',
                }}
              />
              <button type="button" onClick={handleReply} disabled={submitting || !replyText.trim()}
                style={{
                  padding: '0.5rem 0.85rem', borderRadius: 'var(--radius-md)',
                  background: 'var(--color-turquoise)', color: '#fff', border: 'none',
                  fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-main)', fontSize: '0.85rem',
                  opacity: submitting || !replyText.trim() ? 0.6 : 1,
                }}>Post</button>
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {comment.replies?.length > 0 && (
        <div style={{ paddingLeft: '2.65rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {comment.replies.map((r) => (
            <div key={r.id} style={{ display: 'flex', gap: '0.65rem' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, var(--color-coral-light), #FFD6D6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-coral-dark)',
                border: '2px solid var(--color-border)',
              }}>
                {(r.authorName || '?').split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  background: 'var(--color-surface)', borderRadius: '0 var(--radius-md) var(--radius-md) var(--radius-md)',
                  padding: '0.5rem 0.85rem', border: '1px solid var(--color-border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-deep)' }}>{r.authorName}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>{timeAgo(r.createdAt)}</span>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-deep)', lineHeight: 1.5, margin: 0 }}>{r.body}</p>
                </div>
                {r.userId === currentUserId && (
                  <button type="button" onClick={() => onDelete(r.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-error)', fontFamily: 'var(--font-main)', padding: '0.2rem 0 0 0.2rem' }}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main DiveLogDetail page ──────────────────────────────────────────────────

export default function DiveLogDetail() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const { token, user } = useAuth()

  const [log, setLog]               = useState(null)
  const [animals, setAnimals]       = useState([])
  const [companions, setCompanions] = useState([])
  const [comments, setComments]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')

  const [likeLoading, setLikeLoading] = useState(false)
  const [likedByMe, setLikedByMe]     = useState(false)
  const [likeCount, setLikeCount]     = useState(0)

  const [commentText, setCommentText] = useState('')
  const [commenting, setCommenting]   = useState(false)

  const commentsRef = useRef(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([apiDiveLogDetail(token, id), apiGetComments(token, id)])
      .then(([detail, commentsData]) => {
        setLog(detail.log)
        setAnimals(detail.animals || [])
        setCompanions(detail.companions || [])
        setLikedByMe(detail.log.likedByMe)
        setLikeCount(detail.log.likeCount)
        setComments(commentsData.comments || [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id, token])

  // Scroll to comments if hash is #comments
  useEffect(() => {
    if (!loading && window.location.hash === '#comments' && commentsRef.current) {
      commentsRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [loading])

  const handleLike = async () => {
    setLikeLoading(true)
    const wasLiked = likedByMe
    setLikedByMe(!wasLiked)
    setLikeCount((c) => wasLiked ? c - 1 : c + 1)
    try {
      await apiToggleLike(token, id)
    } catch {
      setLikedByMe(wasLiked)
      setLikeCount((c) => wasLiked ? c + 1 : c - 1)
    } finally {
      setLikeLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!commentText.trim()) return
    setCommenting(true)
    try {
      const { comment } = await apiAddComment(token, id, commentText.trim())
      setComments((prev) => [...prev, comment])
      setCommentText('')
    } catch {}
    setCommenting(false)
  }

  const handleReply = async (parentId, body) => {
    const { comment } = await apiAddComment(token, id, body, parentId)
    setComments((prev) => prev.map((c) =>
      c.id === parentId ? { ...c, replies: [...(c.replies || []), comment] } : c
    ))
  }

  const handleDelete = async (commentId) => {
    await apiDeleteComment(token, commentId)
    // Remove from top-level or from replies
    setComments((prev) => prev
      .filter((c) => c.id !== commentId)
      .map((c) => ({ ...c, replies: (c.replies || []).filter((r) => r.id !== commentId) }))
    )
  }

  if (loading) {
    return (
      <>
        <style>{shimmerKeyframe}</style>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{
              height: '120px', borderRadius: 'var(--radius-card)',
              background: 'linear-gradient(90deg, var(--color-border) 25%, var(--color-turquoise-light) 50%, var(--color-border) 75%)',
              backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
            }} />
          ))}
        </div>
      </>
    )
  }

  if (error || !log) {
    return (
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem 1.25rem', fontFamily: 'var(--font-main)' }}>
        <p style={{ color: 'var(--color-error)' }}>{error || 'Dive log not found.'}</p>
        <button onClick={() => navigate(-1)} style={{ marginTop: '1rem', color: 'var(--color-turquoise-dark)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-main)' }}>← Go back</button>
      </div>
    )
  }

  const initials = (log.authorName || '?').split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
  const buddies  = companions.filter((c) => c.role === 'buddy')
  const dm       = companions.find((c) => c.role === 'divemaster')
  const gearItems = [
    log.gear_hood    && '🧢 Hood',
    log.gear_gloves  && '🧤 Gloves',
    log.gear_boots   && '👢 Boots',
    log.gear_torch   && '🔦 Torch',
    log.gear_camera  && '📷 Camera',
    log.gear_computer&& '💻 Computer',
    log.gear_scooter && '🛵 Scooter',
  ].filter(Boolean)

  return (
    <>
      <style>{shimmerKeyframe}</style>
      <div style={{
        maxWidth: '680px', margin: '0 auto', padding: '2rem 1.25rem 5rem',
        display: 'flex', flexDirection: 'column', gap: '1.1rem',
        fontFamily: 'var(--font-main)',
      }}>
        {/* Back button */}
        <button onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', fontSize: '0.88rem', fontWeight: 700, fontFamily: 'var(--font-main)', alignSelf: 'flex-start', padding: 0 }}>
          ← Back
        </button>

        {/* Hero header */}
        <div style={{
          background: 'linear-gradient(135deg, #0077B6 0%, #00B4D8 100%)',
          borderRadius: 'var(--radius-card)', padding: '1.5rem',
          color: '#fff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0,
              background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '0.9rem', fontWeight: 800,
            }}>{initials}</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{log.authorName}</div>
              <div style={{ fontSize: '0.78rem', opacity: 0.8 }}>
                {LEVEL_LABEL[log.authorLevel] ?? log.authorLevel}
              </div>
            </div>
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.35rem' }}>
            🤿 {log.dive_site_name}
          </h1>
          <p style={{ fontSize: '0.9rem', opacity: 0.85, marginBottom: '0.75rem' }}>
            {log.country} · {formatDate(log.dive_date)}
            {log.entry_type && <span> · {log.entry_type === 'boat' ? '🚢 Boat dive' : log.entry_type === 'shore' ? '🏖️ Shore dive' : '🌊 Dive'}</span>}
          </p>
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.9rem', opacity: 0.95 }}>
            {log.max_depth_m   && <span>📏 {log.max_depth_m}m depth</span>}
            {log.duration_min  && <span>⏱ {log.duration_min} min</span>}
            {log.visibility    && VISIBILITY_INFO[log.visibility] && <span>{VISIBILITY_INFO[log.visibility].icon} {VISIBILITY_INFO[log.visibility].label}</span>}
            {log.current       && <span>{CURRENT_INFO[log.current] || log.current}</span>}
          </div>
          {/* Like row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.25)' }}>
            <button type="button" onClick={handleLike} disabled={likeLoading}
              style={{
                background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.4)',
                borderRadius: '999px', padding: '0.3rem 0.9rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                color: '#fff', fontSize: '0.9rem', fontWeight: 700, fontFamily: 'var(--font-main)',
              }}>
              <span style={{ display: 'inline-block', animation: likedByMe ? 'heartBeat 0.4s ease' : 'none' }}>
                {likedByMe ? '❤️' : '🤍'}
              </span>
              {likeCount > 0 ? likeCount : 'Like'}
            </button>
            <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>
              {comments.length > 0 ? `💬 ${comments.length} comment${comments.length !== 1 ? 's' : ''}` : '💬 Be the first to comment'}
            </span>
          </div>
        </div>

        {/* Animals */}
        {animals.length > 0 && (
          <InfoSection title="🐠 Wildlife Spotted">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {animals.map((a) => (
                <div key={a.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  background: 'var(--color-turquoise-light)', borderRadius: '999px',
                  padding: '0.35rem 0.85rem', border: '1.5px solid var(--color-turquoise)',
                }}>
                  <span style={{ fontSize: '1.2rem' }}>{a.emoji || '🐟'}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-deep)' }}>
                    {a.speciesName || a.customName}
                  </span>
                  {a.count > 1 && <span style={{ fontSize: '0.75rem', color: 'var(--color-turquoise-dark)', fontWeight: 800 }}>×{a.count}</span>}
                </div>
              ))}
            </div>
          </InfoSection>
        )}

        {/* Conditions */}
        {(log.water_type || log.body_of_water || log.air_temp_c || log.water_temp_surface_c || log.water_temp_bottom_c) && (
          <InfoSection title="🌊 Conditions">
            <StatRow items={[
              ['Water', [log.water_type, log.body_of_water].filter(Boolean).map((v) => v.charAt(0).toUpperCase() + v.slice(1)).join(' · ') || null],
              ['Air Temp',     log.air_temp_c            != null ? `${log.air_temp_c}°C`           : null],
              ['Surface',      log.water_temp_surface_c  != null ? `${log.water_temp_surface_c}°C` : null],
              ['Bottom',       log.water_temp_bottom_c   != null ? `${log.water_temp_bottom_c}°C`  : null],
            ]} />
          </InfoSection>
        )}

        {/* Dive metrics */}
        {(log.avg_depth_m || log.surface_interval_min || log.pressure_start_bar || log.pressure_end_bar) && (
          <InfoSection title="📊 Dive Metrics">
            <StatRow items={[
              ['Avg Depth',      log.avg_depth_m           != null ? `${log.avg_depth_m}m`          : null],
              ['Surface Interval', log.surface_interval_min != null ? `${log.surface_interval_min} min` : null],
              ['Start Pressure', log.pressure_start_bar    != null ? `${log.pressure_start_bar} bar` : null],
              ['End Pressure',   log.pressure_end_bar      != null ? `${log.pressure_end_bar} bar`   : null],
            ]} />
          </InfoSection>
        )}

        {/* Gear */}
        {(log.wetsuit_type || log.weight_kg || log.gas_mixture || gearItems.length > 0) && (
          <InfoSection title="⚙️ Gear">
            <StatRow items={[
              ['Wetsuit',     WETSUIT_INFO[log.wetsuit_type]  || null],
              ['Weight',      log.weight_kg != null ? `${log.weight_kg}kg${log.weight_feeling === 'too_heavy' ? ' (heavy)' : log.weight_feeling === 'too_light' ? ' (light)' : log.weight_feeling === 'good' ? ' (good)' : ''}` : null],
              ['Gas',         GAS_INFO[log.gas_mixture]       || null],
              ['Cylinder',    log.cylinder_volume_l ? `${log.cylinder_volume_l}L${log.cylinder_material ? ' ' + log.cylinder_material : ''}` : null],
            ]} />
            {gearItems.length > 0 && (
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                {gearItems.map((g) => (
                  <span key={g} style={{
                    fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-turquoise-dark)',
                    background: 'var(--color-turquoise-light)', borderRadius: '999px',
                    padding: '0.25rem 0.65rem', border: '1.5px solid var(--color-turquoise)',
                  }}>{g}</span>
                ))}
              </div>
            )}
          </InfoSection>
        )}

        {/* Crew */}
        {(buddies.length > 0 || dm) && (
          <InfoSection title="👥 The Crew">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {buddies.map((b) => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <span>🤿</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-deep)' }}>{b.name}</span>
                  {b.userId && <span style={{ fontSize: '0.72rem', color: 'var(--color-success)', fontWeight: 700 }}>DeepDive ✓</span>}
                </div>
              ))}
              {dm && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <span>⭐</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-deep)' }}>{dm.name}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-muted)' }}>Divemaster</span>
                  {dm.verified && <span style={{ fontSize: '0.72rem', color: '#F4A623', fontWeight: 700 }}>🏅 Verified</span>}
                </div>
              )}
              {log.shop_name && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <span>🏪</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-deep)' }}>{log.shop_name}</span>
                </div>
              )}
            </div>
          </InfoSection>
        )}

        {/* Reviews */}
        {(log.site_rating || log.shop_rating || log.divemaster_rating) && (
          <InfoSection title="⭐ Reviews">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {log.site_rating > 0 && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-muted)', marginBottom: '0.2rem' }}>🏝️ Dive Site</div>
                  <div style={{ display: 'flex', gap: '2px' }}>{[1,2,3,4,5].map((n) => <span key={n} style={{ fontSize: '1.1rem', color: n <= log.site_rating ? '#F4A623' : 'var(--color-border)' }}>★</span>)}</div>
                  {log.site_review && <p style={{ fontSize: '0.88rem', color: 'var(--color-deep)', marginTop: '0.3rem', lineHeight: 1.5 }}>{log.site_review}</p>}
                </div>
              )}
              {log.shop_name && log.shop_rating > 0 && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-muted)', marginBottom: '0.2rem' }}>🏪 {log.shop_name}</div>
                  <div style={{ display: 'flex', gap: '2px' }}>{[1,2,3,4,5].map((n) => <span key={n} style={{ fontSize: '1.1rem', color: n <= log.shop_rating ? '#F4A623' : 'var(--color-border)' }}>★</span>)}</div>
                  {log.shop_review && <p style={{ fontSize: '0.88rem', color: 'var(--color-deep)', marginTop: '0.3rem', lineHeight: 1.5 }}>{log.shop_review}</p>}
                </div>
              )}
              {log.divemaster_name && log.divemaster_rating > 0 && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-muted)', marginBottom: '0.2rem' }}>⭐ {log.divemaster_name}</div>
                  <div style={{ display: 'flex', gap: '2px' }}>{[1,2,3,4,5].map((n) => <span key={n} style={{ fontSize: '1.1rem', color: n <= log.divemaster_rating ? '#F4A623' : 'var(--color-border)' }}>★</span>)}</div>
                  {log.divemaster_review && <p style={{ fontSize: '0.88rem', color: 'var(--color-deep)', marginTop: '0.3rem', lineHeight: 1.5 }}>{log.divemaster_review}</p>}
                </div>
              )}
            </div>
          </InfoSection>
        )}

        {/* Notes */}
        {log.notes && (
          <InfoSection title="📝 Notes">
            <p style={{ fontSize: '0.95rem', color: 'var(--color-deep)', lineHeight: 1.7 }}>{log.notes}</p>
          </InfoSection>
        )}

        {/* Comments section */}
        <div ref={commentsRef} id="comments" style={{
          background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-card)', padding: '1.1rem 1.25rem',
          display: 'flex', flexDirection: 'column', gap: '1rem',
        }}>
          <h2 style={{
            fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-muted)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            💬 Comments {comments.length > 0 && `(${comments.length})`}
          </h2>

          {/* New comment input */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--color-coral-light), #FFD6D6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-coral-dark)',
            }}>
              {(user?.name || '?').split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')}
            </div>
            <div style={{ flex: 1, display: 'flex', gap: '0.4rem' }}>
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
                placeholder="Add a comment..."
                style={{
                  flex: 1, padding: '0.6rem 0.85rem', fontSize: '0.9rem',
                  border: '2px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                  fontFamily: 'var(--font-main)', outline: 'none',
                }}
              />
              <button type="button" onClick={handleAddComment} disabled={commenting || !commentText.trim()}
                style={{
                  padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)',
                  background: commentText.trim() ? 'var(--color-turquoise)' : 'var(--color-border)',
                  color: commentText.trim() ? '#fff' : 'var(--color-muted)',
                  border: 'none', fontWeight: 700, cursor: commentText.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: 'var(--font-main)', fontSize: '0.88rem', transition: 'all var(--transition)',
                }}>Post</button>
            </div>
          </div>

          {/* Comments list */}
          {comments.length === 0 ? (
            <p style={{ color: 'var(--color-muted)', fontSize: '0.88rem', textAlign: 'center', padding: '0.5rem 0' }}>
              No comments yet — be the first! 🌊
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {comments.map((c) => (
                <Comment
                  key={c.id}
                  comment={c}
                  onReply={handleReply}
                  onDelete={handleDelete}
                  currentUserId={user?.sub}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
