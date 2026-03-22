import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  apiDiveSiteSearch,
  apiDiveSiteCreate,
  apiSpeciesSearch,
  apiDiveLogCreate,
  apiMyDiveLogs,
} from '../api/diveLogs'
import { apiUsersSearch } from '../api/friends'

// ─── Constants ─────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10)

const STEPS = [
  { label: 'The Dive',    icon: '🤿', depth: '0m'  },
  { label: 'The Numbers', icon: '📊', depth: '5m'  },
  { label: 'The Ocean',   icon: '🌊', depth: '15m' },
  { label: 'The Life',    icon: '🐠', depth: '25m' },
  { label: 'The Crew',    icon: '👥', depth: '15m' },
  { label: 'Wrap Up',     icon: '⚙️', depth: '0m'  },
]

const CATEGORY_TABS = [
  { key: 'all',        label: 'All',          icon: '🌊' },
  { key: 'fish',       label: 'Fish',         icon: '🐟' },
  { key: 'shark_ray',  label: 'Sharks & Rays',icon: '🦈' },
  { key: 'turtle',     label: 'Turtles',      icon: '🐢' },
  { key: 'cephalopod', label: 'Cephalopods',  icon: '🐙' },
  { key: 'crustacean', label: 'Crustaceans',  icon: '🦐' },
  { key: 'mammal',     label: 'Mammals',      icon: '🐬' },
  { key: 'nudibranch', label: 'Nudis',        icon: '🌸' },
  { key: 'other',      label: 'Other',        icon: '⭐' },
]

const VISIBILITY_OPTIONS = [
  { value: 'excellent', label: 'Excellent', sub: '20m+',   bg: 'linear-gradient(135deg,#0077B6,#00B4D8)', color: '#fff' },
  { value: 'good',      label: 'Good',      sub: '10–20m', bg: 'linear-gradient(135deg,#0096C7,#48CAE4)', color: '#fff' },
  { value: 'average',   label: 'Average',   sub: '5–10m',  bg: 'linear-gradient(135deg,#52B69A,#76C893)', color: '#fff' },
  { value: 'poor',      label: 'Poor',      sub: '2–5m',   bg: 'linear-gradient(135deg,#B5838D,#E5989B)', color: '#fff' },
  { value: 'very_poor', label: 'Very Poor', sub: '<2m',    bg: 'linear-gradient(135deg,#6D6875,#B5838D)', color: '#fff' },
]

const CURRENT_OPTIONS = [
  { value: 'none',     label: 'None',      icon: '🪨' },
  { value: 'light',    label: 'Light',     icon: '🌊' },
  { value: 'moderate', label: 'Moderate',  icon: '💨' },
  { value: 'strong',   label: 'Strong',    icon: '💪' },
  { value: 'very_strong', label: 'Surge',  icon: '🚨' },
]

const ENTRY_TYPES = [
  { value: 'boat',  label: 'Boat',  icon: '🚢' },
  { value: 'shore', label: 'Shore', icon: '🏖️' },
  { value: 'other', label: 'Other', icon: '🌊' },
]

const WATER_TYPES = [
  { value: 'salt',     label: 'Salt Water',  icon: '🌊' },
  { value: 'fresh',    label: 'Fresh Water', icon: '🏔️' },
  { value: 'brackish', label: 'Brackish',    icon: '🏭' },
]

const BODY_OPTIONS = [
  { value: 'ocean',  label: 'Ocean',  icon: '🌊' },
  { value: 'sea',    label: 'Sea',    icon: '🌊' },
  { value: 'lake',   label: 'Lake',   icon: '🏔️' },
  { value: 'quarry', label: 'Quarry', icon: '⛏️' },
  { value: 'river',  label: 'River',  icon: '🏞️' },
  { value: 'other',  label: 'Other',  icon: '❓' },
]

const WETSUIT_OPTIONS = [
  { value: 'none',     label: 'No Suit',  icon: '🩱' },
  { value: 'shorty',   label: 'Shorty',   icon: '👙' },
  { value: '3mm',      label: '3mm',      icon: '🤿' },
  { value: '5mm',      label: '5mm',      icon: '🤿' },
  { value: '7mm',      label: '7mm',      icon: '🤿' },
  { value: 'semi_dry', label: 'Semi-dry', icon: '💧' },
  { value: 'dry_suit', label: 'Drysuit',  icon: '❄️' },
]

const ACCESSORIES = [
  { key: 'gearHood',     label: 'Hood',    icon: '🧢' },
  { key: 'gearGloves',   label: 'Gloves',  icon: '🧤' },
  { key: 'gearBoots',    label: 'Boots',   icon: '👢' },
  { key: 'gearTorch',    label: 'Torch',   icon: '🔦' },
  { key: 'gearCamera',   label: 'Camera',  icon: '📷' },
  { key: 'gearComputer', label: 'Computer',icon: '💻' },
  { key: 'gearScooter',  label: 'Scooter', icon: '🛵' },
]

const GAS_OPTIONS = [
  { value: 'air',           label: 'Air',         sub: '21% O₂' },
  { value: 'nitrox32',      label: 'EANx 32',     sub: '32% O₂' },
  { value: 'nitrox36',      label: 'EANx 36',     sub: '36% O₂' },
  { value: 'nitrox40',      label: 'EANx 40',     sub: '40% O₂' },
  { value: 'nitrox_custom', label: 'Custom Nitrox',sub: 'Custom %' },
  { value: 'trimix',        label: 'Trimix',       sub: 'He/O₂/N₂' },
  { value: 'rebreather',    label: 'Rebreather',   sub: 'CCR/SCR' },
]

const CYLINDER_VOLUMES = [8, 10, 12, 15, 18]

// ─── Sub-components ───────────────────────────────────────────────────────────

function TapCard({ value, selected, onClick, icon, label, sub, bg, color, small }) {
  const isSelected = selected === value
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      style={{
        flex: 1,
        minWidth: small ? '80px' : '100px',
        padding: small ? '0.6rem 0.4rem' : '0.85rem 0.5rem',
        borderRadius: 'var(--radius-md)',
        border: `2px solid ${isSelected ? 'var(--color-turquoise)' : 'var(--color-border)'}`,
        background: bg ?? (isSelected ? 'var(--color-turquoise-light)' : 'var(--color-surface)'),
        color: color ?? (isSelected ? 'var(--color-turquoise-dark)' : 'var(--color-muted)'),
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.2rem',
        transition: 'all var(--transition)',
        boxShadow: isSelected ? '0 0 0 3px rgba(0,180,216,0.18)' : 'none',
        fontFamily: 'var(--font-main)',
      }}
    >
      <span style={{ fontSize: small ? '1.2rem' : '1.5rem', lineHeight: 1 }}>{icon}</span>
      <span style={{ fontSize: small ? '0.72rem' : '0.82rem', fontWeight: 700, lineHeight: 1.2 }}>{label}</span>
      {sub && <span style={{ fontSize: '0.68rem', opacity: 0.8 }}>{sub}</span>}
    </button>
  )
}

function StepperInput({ label, value, onChange, min = 0, max = 9999, step = 1, unit, optional }) {
  const num = parseFloat(value) || 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-muted)' }}>
        {label}{optional && <span style={{ fontWeight: 400, fontSize: '0.75rem' }}> (optional)</span>}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button type="button" onClick={() => onChange(Math.max(min, parseFloat((num - step).toFixed(1))))}
          style={{
            width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--color-border)',
            background: 'var(--color-surface)', fontSize: '1.3rem', fontWeight: 700,
            color: 'var(--color-deep)', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-main)',
          }}>−</button>
        <input
          type="number"
          value={value === '' ? '' : value}
          onChange={(e) => onChange(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
          min={min} max={max} step={step}
          style={{
            width: '90px', textAlign: 'center', padding: '0.5rem',
            fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-deep)',
            border: '2px solid var(--color-border)', borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface)', fontFamily: 'var(--font-main)',
          }}
        />
        <button type="button" onClick={() => onChange(Math.min(max, parseFloat((num + step).toFixed(1))))}
          style={{
            width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--color-turquoise)',
            background: 'var(--color-turquoise-light)', fontSize: '1.3rem', fontWeight: 700,
            color: 'var(--color-turquoise-dark)', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-main)',
          }}>+</button>
        {unit && <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-muted)' }}>{unit}</span>}
      </div>
    </div>
  )
}

function StarRating({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '0.25rem' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n === value ? 0 : n)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '1.4rem', padding: '0 0.1rem',
            color: n <= value ? '#F4A623' : 'var(--color-border)',
            transition: 'color var(--transition)',
          }}>★</button>
      ))}
    </div>
  )
}

// ─── Dive profile SVG ─────────────────────────────────────────────────────────

function DiveProfileSVG({ maxDepth, duration }) {
  const d = parseFloat(maxDepth) || 0
  const t = parseFloat(duration) || 0
  if (!d || !t) {
    return (
      <div style={{
        height: '80px', borderRadius: 'var(--radius-md)',
        background: 'var(--color-turquoise-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--color-muted)', fontSize: '0.85rem',
      }}>
        Enter depth & duration to see your dive profile
      </div>
    )
  }
  const W = 300, H = 80, PAD = 20
  const descendX = W * 0.2
  const bottomX  = W * 0.75
  const path = `M ${PAD} ${PAD} L ${descendX} ${H - PAD} L ${bottomX} ${H - PAD} L ${W - PAD} ${PAD}`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '80px', display: 'block' }}>
      <defs>
        <linearGradient id="profileGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00B4D8" stopOpacity="0.15"/>
          <stop offset="100%" stopColor="#00B4D8" stopOpacity="0.4"/>
        </linearGradient>
      </defs>
      <path d={`${path} Z`} fill="url(#profileGrad)" />
      <path d={path} fill="none" stroke="#00B4D8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <text x={PAD} y={H - 4} fontSize="9" fill="#7A9BAD" fontFamily="Nunito">0m</text>
      <text x={W / 2} y={H - 4} fontSize="9" fill="#0096B4" fontFamily="Nunito" textAnchor="middle">{d}m</text>
      <text x={W - PAD} y={14} fontSize="9" fill="#7A9BAD" fontFamily="Nunito" textAnchor="end">{t} min</text>
    </svg>
  )
}

// ─── Depth Gauge (progress indicator) ────────────────────────────────────────

function DepthGauge({ step }) {
  const depths = ['0m', '5m', '15m', '25m', '15m', '0m']
  return (
    <div style={{
      position: 'fixed', right: '12px', top: '50%', transform: 'translateY(-50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0', zIndex: 10,
    }}>
      <div style={{
        width: '3px', background: 'var(--color-border)',
        height: `${(STEPS.length - 1) * 40}px`, borderRadius: '2px',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%',
          height: `${((step - 1) / (STEPS.length - 1)) * 100}%`,
          background: 'var(--color-turquoise)', borderRadius: '2px',
          transition: 'height 0.4s ease',
        }} />
      </div>
      {STEPS.map((s, i) => {
        const isActive = step === i + 1
        const isPast   = step > i + 1
        return (
          <div key={i} style={{
            position: 'absolute', top: `${i * 40}px`,
            display: 'flex', alignItems: 'center', gap: '4px', right: '4px',
          }}>
            <div style={{
              width: isActive ? '12px' : '8px',
              height: isActive ? '12px' : '8px',
              borderRadius: '50%',
              background: isActive ? 'var(--color-turquoise)' : isPast ? 'var(--color-turquoise)' : 'var(--color-border)',
              border: isActive ? '2px solid var(--color-turquoise-dark)' : 'none',
              boxShadow: isActive ? '0 0 0 3px rgba(0,180,216,0.25)' : 'none',
              transition: 'all 0.3s ease',
              flexShrink: 0,
            }} />
          </div>
        )
      })}
      <div style={{
        position: 'absolute', right: '18px', top: `${(step - 1) * 40 - 8}px`,
        fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-turquoise-dark)',
        background: 'var(--color-turquoise-light)', borderRadius: '6px',
        padding: '1px 5px', whiteSpace: 'nowrap',
        transition: 'top 0.4s ease',
      }}>{depths[step - 1]}</div>
    </div>
  )
}

// ─── Step 1: The Dive ─────────────────────────────────────────────────────────

function Step1({ form, setForm, token }) {
  const [siteQuery, setSiteQuery]     = useState(form.diveSiteName || '')
  const [sites, setSites]             = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (siteQuery.trim().length < 2) { setSites([]); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await apiDiveSiteSearch(token, siteQuery.trim())
        setSites(data.sites)
        setShowDropdown(true)
      } catch { setSites([]) }
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [siteQuery, token])

  const selectSite = (site) => {
    setForm((f) => ({ ...f, diveSiteId: site.id, diveSiteName: site.name, country: site.country }))
    setSiteQuery(site.name)
    setShowDropdown(false)
  }

  const clearSite = () => {
    setForm((f) => ({ ...f, diveSiteId: null }))
  }

  const inputStyle = {
    width: '100%', padding: '0.85rem 1rem', fontSize: '1rem',
    border: '2px solid var(--color-border)', borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-main)', color: 'var(--color-deep)',
    background: 'var(--color-surface)', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-deep)' }}>
          🤿 Where did you dive?
        </h2>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Just site + date and you're good to go.
        </p>
      </div>

      {/* Dive site */}
      <div style={{ position: 'relative' }}>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-deep)', marginBottom: '0.35rem' }}>
          Dive Site *
        </label>
        <input
          value={siteQuery}
          onChange={(e) => { setSiteQuery(e.target.value); clearSite(); setForm((f) => ({ ...f, diveSiteName: e.target.value })) }}
          onFocus={() => sites.length > 0 && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          placeholder="e.g. Great Barrier Reef, Sipadan..."
          style={inputStyle}
        />
        {showDropdown && sites.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
            background: 'var(--color-surface)', border: '2px solid var(--color-turquoise)',
            borderTop: 'none', borderRadius: '0 0 var(--radius-md) var(--radius-md)',
            boxShadow: 'var(--shadow-card)', maxHeight: '180px', overflowY: 'auto',
          }}>
            {sites.map((s) => (
              <button key={s.id} type="button" onMouseDown={() => selectSite(s)}
                style={{
                  display: 'block', width: '100%', padding: '0.65rem 1rem',
                  textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-main)', fontSize: '0.92rem', color: 'var(--color-deep)',
                  borderBottom: '1px solid var(--color-border)',
                }}>
                <strong>{s.name}</strong> <span style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>— {s.country}</span>
                {s.visitCount > 0 && <span style={{ float: 'right', fontSize: '0.75rem', color: 'var(--color-turquoise-dark)' }}>{s.visitCount} dives</span>}
              </button>
            ))}
          </div>
        )}
        {form.diveSiteId && (
          <span style={{ fontSize: '0.78rem', color: 'var(--color-success)', marginTop: '0.3rem', display: 'block' }}>
            ✓ Site saved in DeepDive database
          </span>
        )}
      </div>

      {/* Country */}
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-deep)', marginBottom: '0.35rem' }}>
          Country *
        </label>
        <input
          value={form.country}
          onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
          placeholder="e.g. Australia, Indonesia..."
          style={inputStyle}
        />
      </div>

      {/* Date + Times */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-deep)', marginBottom: '0.35rem' }}>Date *</label>
          <input type="date" value={form.diveDate}
            onChange={(e) => setForm((f) => ({ ...f, diveDate: e.target.value }))}
            style={{ ...inputStyle, padding: '0.75rem 0.6rem', fontSize: '0.9rem' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-muted)', marginBottom: '0.35rem' }}>Time In</label>
          <input type="time" value={form.entryTime}
            onChange={(e) => setForm((f) => ({ ...f, entryTime: e.target.value }))}
            style={{ ...inputStyle, padding: '0.75rem 0.6rem', fontSize: '0.9rem' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-muted)', marginBottom: '0.35rem' }}>Time Out</label>
          <input type="time" value={form.exitTime}
            onChange={(e) => setForm((f) => ({ ...f, exitTime: e.target.value }))}
            style={{ ...inputStyle, padding: '0.75rem 0.6rem', fontSize: '0.9rem' }} />
        </div>
      </div>

      {/* Entry type */}
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-deep)', marginBottom: '0.6rem' }}>
          How did you enter? <span style={{ fontWeight: 400, color: 'var(--color-muted)', fontSize: '0.8rem' }}>(optional)</span>
        </label>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          {ENTRY_TYPES.map((e) => (
            <TapCard key={e.value} value={e.value} selected={form.entryType}
              onClick={(v) => setForm((f) => ({ ...f, entryType: f.entryType === v ? '' : v }))}
              icon={e.icon} label={e.label} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Step 2: The Numbers ──────────────────────────────────────────────────────

function Step2({ form, setForm }) {
  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-deep)' }}>
          📊 The Numbers
        </h2>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Depth, time, and pressure — your logbook essentials.
        </p>
      </div>

      <div style={{ background: 'var(--color-turquoise-light)', borderRadius: 'var(--radius-md)', padding: '0.75rem', overflow: 'hidden' }}>
        <DiveProfileSVG maxDepth={form.maxDepthM} duration={form.durationMin} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <StepperInput label="Max Depth" value={form.maxDepthM} onChange={set('maxDepthM')} min={0} max={330} step={1} unit="m" />
        <StepperInput label="Duration"  value={form.durationMin} onChange={set('durationMin')} min={0} max={300} step={1} unit="min" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <StepperInput label="Avg Depth" value={form.avgDepthM} onChange={set('avgDepthM')} min={0} max={330} step={1} unit="m" optional />
        <StepperInput label="Surface Interval" value={form.surfaceIntervalMin} onChange={set('surfaceIntervalMin')} min={0} max={1440} step={1} unit="min" optional />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <StepperInput label="Start Pressure" value={form.pressureStartBar} onChange={set('pressureStartBar')} min={0} max={350} step={10} unit="bar" optional />
        <StepperInput label="End Pressure"   value={form.pressureEndBar}   onChange={set('pressureEndBar')}   min={0} max={350} step={10} unit="bar" optional />
      </div>
    </div>
  )
}

// ─── Step 3: The Ocean ────────────────────────────────────────────────────────

function Step3({ form, setForm }) {
  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }))
  const toggle = (key) => (val) => setForm((f) => ({ ...f, [key]: f[key] === val ? '' : val }))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-deep)' }}>🌊 The Ocean</h2>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Conditions help future divers plan this site.</p>
      </div>

      {/* Water type */}
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-deep)', marginBottom: '0.6rem' }}>Water Type</label>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          {WATER_TYPES.map((w) => (
            <TapCard key={w.value} value={w.value} selected={form.waterType}
              onClick={toggle('waterType')} icon={w.icon} label={w.label} />
          ))}
        </div>
      </div>

      {/* Body of water */}
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-deep)', marginBottom: '0.6rem' }}>Body of Water</label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {BODY_OPTIONS.map((b) => (
            <TapCard key={b.value} value={b.value} selected={form.bodyOfWater}
              onClick={toggle('bodyOfWater')} icon={b.icon} label={b.label} small />
          ))}
        </div>
      </div>

      {/* Temperatures */}
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-deep)', marginBottom: '0.75rem' }}>Temperature</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <StepperInput label="Air Temp"    value={form.airTempC}          onChange={(v) => setForm((f) => ({ ...f, airTempC: v }))}          min={-20} max={50} step={0.5} unit="°C" optional />
          <StepperInput label="Surface"     value={form.waterTempSurfaceC} onChange={(v) => setForm((f) => ({ ...f, waterTempSurfaceC: v }))} min={-2}  max={40} step={0.5} unit="°C" optional />
          <StepperInput label="Bottom"      value={form.waterTempBottomC}  onChange={(v) => setForm((f) => ({ ...f, waterTempBottomC: v }))}  min={-2}  max={40} step={0.5} unit="°C" optional />
        </div>
      </div>

      {/* Visibility */}
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-deep)', marginBottom: '0.6rem' }}>Visibility</label>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {VISIBILITY_OPTIONS.map((v) => (
            <TapCard key={v.value} value={v.value} selected={form.visibility}
              onClick={toggle('visibility')} icon="" label={v.label} sub={v.sub}
              bg={form.visibility === v.value ? v.bg : 'var(--color-surface)'}
              color={form.visibility === v.value ? v.color : 'var(--color-muted)'} small />
          ))}
        </div>
      </div>

      {/* Current */}
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-deep)', marginBottom: '0.6rem' }}>Current</label>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {CURRENT_OPTIONS.map((c) => (
            <TapCard key={c.value} value={c.value} selected={form.current}
              onClick={toggle('current')} icon={c.icon} label={c.label} small />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Step 4: The Life ─────────────────────────────────────────────────────────

function Step4({ animals, setAnimals, token }) {
  const [activeTab, setActiveTab]   = useState('all')
  const [speciesQuery, setQuery]    = useState('')
  const [allSpecies, setAllSpecies] = useState([])
  const [customName, setCustomName] = useState('')
  const debounceRef = useRef(null)

  useEffect(() => {
    apiSpeciesSearch(token, '', 'all').then((d) => setAllSpecies(d.species)).catch(() => {})
  }, [token])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const d = await apiSpeciesSearch(token, speciesQuery, activeTab)
        setAllSpecies(d.species)
      } catch {}
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [speciesQuery, activeTab, token])

  const filteredSpecies = speciesQuery
    ? allSpecies
    : activeTab === 'all'
      ? allSpecies
      : allSpecies.filter((s) => s.category === activeTab)

  const addedIds = new Set(animals.map((a) => a.speciesId).filter(Boolean))

  const addSpecies = (s) => {
    if (addedIds.has(s.id)) return
    setAnimals((prev) => [...prev, { speciesId: s.id, name: s.commonName, emoji: s.emoji, count: 1 }])
  }

  const adjustCount = (idx, delta) => {
    setAnimals((prev) => prev.map((a, i) =>
      i === idx ? { ...a, count: Math.max(1, (a.count || 1) + delta) } : a
    ))
  }

  const removeAnimal = (idx) => setAnimals((prev) => prev.filter((_, i) => i !== idx))

  const addCustom = () => {
    if (!customName.trim()) return
    setAnimals((prev) => [...prev, { speciesId: null, customName: customName.trim(), name: customName.trim(), emoji: '🐟', count: 1 }])
    setCustomName('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-deep)' }}>🐠 The Life</h2>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          What did you see down there? This is the best part! 🌈
        </p>
      </div>

      {/* My Sightings tray */}
      {animals.length > 0 && (
        <div style={{
          background: 'var(--color-turquoise-light)', borderRadius: 'var(--radius-md)',
          padding: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem',
        }}>
          {animals.map((a, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              background: 'var(--color-surface)', borderRadius: '999px',
              padding: '0.3rem 0.6rem', border: '1.5px solid var(--color-turquoise)',
              fontSize: '0.85rem',
            }}>
              <span>{a.emoji}</span>
              <span style={{ fontWeight: 700, color: 'var(--color-deep)' }}>{a.name}</span>
              <button type="button" onClick={() => adjustCount(i, -1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--color-muted)', padding: '0 2px' }}>−</button>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-turquoise-dark)', minWidth: '12px', textAlign: 'center' }}>{a.count}</span>
              <button type="button" onClick={() => adjustCount(i, 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--color-turquoise-dark)', padding: '0 2px' }}>+</button>
              <button type="button" onClick={() => removeAnimal(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--color-coral)', padding: '0 2px' }}>×</button>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <input
        value={speciesQuery}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="🔍 Search species..."
        style={{
          width: '100%', padding: '0.75rem 1rem', fontSize: '0.95rem',
          border: '2px solid var(--color-border)', borderRadius: 'var(--radius-md)',
          fontFamily: 'var(--font-main)', outline: 'none', boxSizing: 'border-box',
        }}
      />

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {CATEGORY_TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
            style={{
              flexShrink: 0, padding: '0.35rem 0.7rem', borderRadius: '999px',
              border: `1.5px solid ${activeTab === t.key ? 'var(--color-turquoise)' : 'var(--color-border)'}`,
              background: activeTab === t.key ? 'var(--color-turquoise-light)' : 'var(--color-surface)',
              color: activeTab === t.key ? 'var(--color-turquoise-dark)' : 'var(--color-muted)',
              fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-main)',
              whiteSpace: 'nowrap',
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Species grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem',
        maxHeight: '280px', overflowY: 'auto', paddingRight: '2px',
      }}>
        {filteredSpecies.map((s) => {
          const added = addedIds.has(s.id)
          return (
            <button key={s.id} type="button" onClick={() => addSpecies(s)}
              style={{
                padding: '0.6rem 0.3rem', borderRadius: 'var(--radius-md)',
                border: `2px solid ${added ? 'var(--color-turquoise)' : 'var(--color-border)'}`,
                background: added ? 'var(--color-turquoise-light)' : 'var(--color-surface)',
                cursor: added ? 'default' : 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem',
                fontFamily: 'var(--font-main)', position: 'relative',
              }}>
              <span style={{ fontSize: '1.4rem' }}>{s.emoji}</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-deep)', textAlign: 'center', lineHeight: 1.2 }}>{s.commonName}</span>
              {added && (
                <span style={{
                  position: 'absolute', top: '4px', right: '4px', width: '14px', height: '14px',
                  borderRadius: '50%', background: 'var(--color-turquoise)', color: '#fff',
                  fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800,
                }}>✓</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Custom animal */}
      <div>
        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-muted)', marginBottom: '0.4rem' }}>
          🐾 Not in the list? Add a custom sighting:
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustom()}
            placeholder="e.g. Giant isopod, mystery nudibranch..."
            style={{
              flex: 1, padding: '0.65rem 0.85rem', fontSize: '0.9rem',
              border: '2px solid var(--color-border)', borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-main)', outline: 'none',
            }}
          />
          <button type="button" onClick={addCustom}
            style={{
              padding: '0.65rem 1rem', borderRadius: 'var(--radius-md)',
              background: 'var(--color-turquoise)', color: '#fff', border: 'none',
              fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-main)', fontSize: '0.9rem',
            }}>Add</button>
        </div>
      </div>
    </div>
  )
}

// ─── Step 5: The Crew ─────────────────────────────────────────────────────────

function Step5({ form, setForm, token }) {
  const [buddyQuery, setBuddyQuery] = useState('')
  const [buddySuggestions, setBuddySuggestions] = useState([])
  const debounceRef = useRef(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (buddyQuery.trim().length < 2) { setBuddySuggestions([]); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const d = await apiUsersSearch(token, buddyQuery.trim())
        setBuddySuggestions(d.users)
      } catch { setBuddySuggestions([]) }
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [buddyQuery, token])

  const addBuddy = (u) => {
    const already = form.companions.some((c) => c.userId === u.id)
    if (!already) {
      setForm((f) => ({
        ...f,
        companions: [...f.companions, { userId: u.id, name: u.fullName, role: 'buddy', verified: false }],
      }))
    }
    setBuddyQuery('')
    setBuddySuggestions([])
  }

  const addBuddyCustom = () => {
    if (!buddyQuery.trim()) return
    setForm((f) => ({
      ...f,
      companions: [...f.companions, { userId: null, name: buddyQuery.trim(), role: 'buddy', verified: false }],
    }))
    setBuddyQuery('')
  }

  const removeBuddy = (idx) => setForm((f) => ({
    ...f, companions: f.companions.filter((_, i) => i !== idx),
  }))

  const inputStyle = {
    width: '100%', padding: '0.85rem 1rem', fontSize: '1rem',
    border: '2px solid var(--color-border)', borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-main)', color: 'var(--color-deep)',
    background: 'var(--color-surface)', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-deep)' }}>👥 The Crew</h2>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Who shared the water with you?</p>
      </div>

      {/* Buddies */}
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-deep)', marginBottom: '0.5rem' }}>
          🤿 Dive Buddies
        </label>
        <div style={{ position: 'relative' }}>
          <input
            value={buddyQuery}
            onChange={(e) => setBuddyQuery(e.target.value)}
            onBlur={() => setTimeout(() => setBuddySuggestions([]), 200)}
            placeholder="Search DeepDive users or type a name..."
            style={inputStyle}
          />
          {buddySuggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
              background: 'var(--color-surface)', border: '2px solid var(--color-turquoise)',
              borderTop: 'none', borderRadius: '0 0 var(--radius-md) var(--radius-md)',
              boxShadow: 'var(--shadow-card)',
            }}>
              {buddySuggestions.map((u) => (
                <button key={u.id} type="button" onMouseDown={() => addBuddy(u)}
                  style={{
                    display: 'block', width: '100%', padding: '0.6rem 1rem',
                    textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-main)', fontSize: '0.9rem', color: 'var(--color-deep)',
                    borderBottom: '1px solid var(--color-border)',
                  }}>
                  {u.fullName}
                </button>
              ))}
            </div>
          )}
        </div>
        {buddyQuery.trim().length > 0 && (
          <button type="button" onClick={addBuddyCustom}
            style={{
              marginTop: '0.4rem', fontSize: '0.82rem', color: 'var(--color-turquoise-dark)',
              background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-main)',
              padding: 0, fontWeight: 700,
            }}>
            + Add "{buddyQuery.trim()}" as external buddy
          </button>
        )}
        {form.companions.filter((c) => c.role === 'buddy').length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.6rem' }}>
            {form.companions.map((c, i) => c.role === 'buddy' && (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                background: 'var(--color-turquoise-light)', borderRadius: '999px',
                padding: '0.3rem 0.75rem', border: '1.5px solid var(--color-turquoise)',
                fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-turquoise-dark)',
              }}>
                {c.name}
                {c.userId && <span style={{ fontSize: '0.7rem' }}>✓</span>}
                <button type="button" onClick={() => removeBuddy(i)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-coral)', fontSize: '0.9rem', padding: 0 }}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Divemaster */}
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-deep)', marginBottom: '0.5rem' }}>
          ⭐ Dive Master <span style={{ color: 'var(--color-muted)', fontWeight: 400 }}>(optional)</span>
        </label>
        <input
          value={form.divemasterName}
          onChange={(e) => setForm((f) => ({ ...f, divemasterName: e.target.value }))}
          placeholder="Divemaster's name..."
          style={inputStyle}
        />
        {form.divemasterName.trim() && (
          <label style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--color-deep)', cursor: 'pointer',
          }}>
            <input type="checkbox"
              checked={form.companions.some((c) => c.role === 'divemaster' && c.verified)}
              onChange={(e) => {
                const existing = form.companions.find((c) => c.role === 'divemaster')
                if (existing) {
                  setForm((f) => ({
                    ...f,
                    companions: f.companions.map((c) =>
                      c.role === 'divemaster' ? { ...c, verified: e.target.checked } : c
                    ),
                  }))
                } else {
                  setForm((f) => ({
                    ...f,
                    companions: [...f.companions, {
                      userId: null, name: f.divemasterName.trim(),
                      role: 'divemaster', verified: e.target.checked,
                    }],
                  }))
                }
              }}
            />
            <span>🏅 Verified by this DM</span>
          </label>
        )}
      </div>

      {/* Dive shop */}
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-deep)', marginBottom: '0.5rem' }}>
          🏪 Dive Shop <span style={{ color: 'var(--color-muted)', fontWeight: 400 }}>(optional)</span>
        </label>
        <input
          value={form.shopName}
          onChange={(e) => setForm((f) => ({ ...f, shopName: e.target.value }))}
          placeholder="Which shop did you dive with?"
          style={inputStyle}
        />
      </div>
    </div>
  )
}

// ─── Step 6: Wrap Up ──────────────────────────────────────────────────────────

function Step6({ form, setForm, animals, token }) {
  const [showGas, setShowGas]       = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [copying, setCopying]       = useState(false)

  const copyLastDive = async () => {
    setCopying(true)
    try {
      const { logs } = await apiMyDiveLogs(token)
      if (logs && logs.length > 0) {
        const last = logs[0]
        // We need the full log - but mine only returns summary
        // Just copy basic gear hints from the list
        setForm((f) => ({ ...f, _copiedFrom: last.siteName }))
      }
    } catch {}
    setCopying(false)
  }

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }))
  const toggle = (key) => (val) => setForm((f) => ({ ...f, [key]: f[key] === val ? '' : val }))

  const inputStyle = {
    width: '100%', padding: '0.85rem 1rem', fontSize: '1rem',
    border: '2px solid var(--color-border)', borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-main)', color: 'var(--color-deep)',
    background: 'var(--color-surface)', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-deep)' }}>⚙️ Wrap Up</h2>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Gear, notes, and how was it?</p>
        </div>
        <button type="button" onClick={copyLastDive} disabled={copying}
          style={{
            padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-md)',
            background: 'var(--color-sand)', border: '1.5px solid var(--color-border)',
            fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-deep)',
            cursor: 'pointer', fontFamily: 'var(--font-main)', flexShrink: 0,
          }}>
          {copying ? '...' : '⚡ Copy last dive'}
        </button>
      </div>

      {/* Wetsuit */}
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-deep)', marginBottom: '0.6rem' }}>
          Wetsuit
        </label>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {WETSUIT_OPTIONS.map((w) => (
            <TapCard key={w.value} value={w.value} selected={form.wetsuitType}
              onClick={toggle('wetsuitType')} icon={w.icon} label={w.label} small />
          ))}
        </div>
      </div>

      {/* Weight */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5rem', flexWrap: 'wrap' }}>
        <StepperInput label="Weight" value={form.weightKg} onChange={set('weightKg')} min={0} max={30} step={0.5} unit="kg" optional />
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-muted)', marginBottom: '0.5rem' }}>Feeling</label>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {[['too_heavy','😤'],['good','😊'],['too_light','😅']].map(([val, icon]) => (
              <button key={val} type="button" onClick={() => setForm((f) => ({ ...f, weightFeeling: f.weightFeeling === val ? '' : val }))}
                style={{
                  width: '48px', height: '48px', borderRadius: 'var(--radius-md)',
                  border: `2px solid ${form.weightFeeling === val ? 'var(--color-turquoise)' : 'var(--color-border)'}`,
                  background: form.weightFeeling === val ? 'var(--color-turquoise-light)' : 'var(--color-surface)',
                  fontSize: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{icon}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Accessories */}
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-deep)', marginBottom: '0.6rem' }}>
          Accessories
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {ACCESSORIES.map(({ key, label, icon }) => (
            <button key={key} type="button"
              onClick={() => setForm((f) => ({ ...f, [key]: !f[key] }))}
              style={{
                padding: '0.45rem 0.85rem', borderRadius: '999px',
                border: `2px solid ${form[key] ? 'var(--color-turquoise)' : 'var(--color-border)'}`,
                background: form[key] ? 'var(--color-turquoise-light)' : 'var(--color-surface)',
                color: form[key] ? 'var(--color-turquoise-dark)' : 'var(--color-muted)',
                fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-main)',
              }}>
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced gas */}
      <div>
        <button type="button" onClick={() => setShowGas((v) => !v)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-muted)',
            display: 'flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'var(--font-main)', padding: 0,
          }}>
          {showGas ? '▼' : '▶'} 🛢️ Gas & Cylinder (advanced)
        </button>
        {showGas && (
          <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Cylinder material */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-deep)', marginBottom: '0.4rem' }}>Material</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[['steel','🔩 Steel'],['aluminium','🫙 Aluminium'],['other','❓ Other']].map(([val, lbl]) => (
                  <button key={val} type="button" onClick={() => setForm((f) => ({ ...f, cylinderMaterial: f.cylinderMaterial === val ? '' : val }))}
                    style={{
                      flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-md)',
                      border: `2px solid ${form.cylinderMaterial === val ? 'var(--color-turquoise)' : 'var(--color-border)'}`,
                      background: form.cylinderMaterial === val ? 'var(--color-turquoise-light)' : 'var(--color-surface)',
                      color: form.cylinderMaterial === val ? 'var(--color-turquoise-dark)' : 'var(--color-muted)',
                      fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-main)',
                    }}>{lbl}</button>
                ))}
              </div>
            </div>
            {/* Volume chips */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-deep)', marginBottom: '0.4rem' }}>Volume</label>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {CYLINDER_VOLUMES.map((v) => (
                  <button key={v} type="button" onClick={() => setForm((f) => ({ ...f, cylinderVolumeL: f.cylinderVolumeL === v ? '' : v }))}
                    style={{
                      padding: '0.4rem 0.75rem', borderRadius: '999px',
                      border: `2px solid ${form.cylinderVolumeL === v ? 'var(--color-turquoise)' : 'var(--color-border)'}`,
                      background: form.cylinderVolumeL === v ? 'var(--color-turquoise-light)' : 'var(--color-surface)',
                      color: form.cylinderVolumeL === v ? 'var(--color-turquoise-dark)' : 'var(--color-muted)',
                      fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-main)',
                    }}>{v}L</button>
                ))}
              </div>
            </div>
            {/* Gas mixture */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-deep)', marginBottom: '0.4rem' }}>Gas Mixture</label>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {GAS_OPTIONS.map((g) => (
                  <button key={g.value} type="button" onClick={() => setForm((f) => ({ ...f, gasMixture: f.gasMixture === g.value ? '' : g.value }))}
                    style={{
                      padding: '0.4rem 0.75rem', borderRadius: '999px',
                      border: `2px solid ${form.gasMixture === g.value ? 'var(--color-turquoise)' : 'var(--color-border)'}`,
                      background: form.gasMixture === g.value ? 'var(--color-turquoise-light)' : 'var(--color-surface)',
                      color: form.gasMixture === g.value ? 'var(--color-turquoise-dark)' : 'var(--color-muted)',
                      fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-main)',
                      flexDirection: 'column', display: 'flex', alignItems: 'center',
                    }}>
                    <span>{g.label}</span>
                    <span style={{ fontSize: '0.65rem', opacity: 0.75 }}>{g.sub}</span>
                  </button>
                ))}
              </div>
            </div>
            {form.gasMixture === 'nitrox_custom' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-deep)', marginBottom: '0.4rem' }}>O₂ %</label>
                <StepperInput label="" value={form.gasO2Percent} onChange={set('gasO2Percent')} min={21} max={100} step={1} unit="%" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-deep)', marginBottom: '0.5rem' }}>
          📝 Notes <span style={{ fontWeight: 400, color: 'var(--color-muted)', fontSize: '0.8rem' }}>(optional)</span>
        </label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder="Anything memorable about this dive..."
          rows={3}
          style={{
            ...inputStyle, resize: 'vertical', lineHeight: 1.6, fontSize: '0.95rem',
          }}
        />
      </div>

      {/* Reviews */}
      <div>
        <button type="button" onClick={() => setShowReview((v) => !v)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-muted)',
            display: 'flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'var(--font-main)', padding: 0,
          }}>
          {showReview ? '▼' : '▶'} ⭐ Reviews (site, shop, divemaster)
        </button>
        {showReview && (
          <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Site rating */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-deep)', marginBottom: '0.35rem' }}>🏝️ Dive Site Rating</label>
              <StarRating value={form.siteRating} onChange={set('siteRating')} />
              {form.siteRating > 0 && (
                <textarea value={form.siteReview} onChange={(e) => setForm((f) => ({ ...f, siteReview: e.target.value }))}
                  placeholder="Tell others what this site is like..." rows={2}
                  style={{ ...inputStyle, marginTop: '0.5rem', resize: 'none', fontSize: '0.9rem' }} />
              )}
            </div>
            {/* Shop rating */}
            {form.shopName && (
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-deep)', marginBottom: '0.35rem' }}>🏪 {form.shopName} Rating</label>
                <StarRating value={form.shopRating} onChange={set('shopRating')} />
                {form.shopRating > 0 && (
                  <textarea value={form.shopReview} onChange={(e) => setForm((f) => ({ ...f, shopReview: e.target.value }))}
                    placeholder="How was the service?" rows={2}
                    style={{ ...inputStyle, marginTop: '0.5rem', resize: 'none', fontSize: '0.9rem' }} />
                )}
              </div>
            )}
            {/* DM rating */}
            {form.divemasterName && (
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-deep)', marginBottom: '0.35rem' }}>⭐ {form.divemasterName} Rating</label>
                <StarRating value={form.divemasterRating} onChange={set('divemasterRating')} />
                {form.divemasterRating > 0 && (
                  <textarea value={form.divemasterReview} onChange={(e) => setForm((f) => ({ ...f, divemasterReview: e.target.value }))}
                    placeholder="How was their guidance?" rows={2}
                    style={{ ...inputStyle, marginTop: '0.5rem', resize: 'none', fontSize: '0.9rem' }} />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Privacy */}
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-deep)', marginBottom: '0.6rem' }}>
          Who can see this dive?
        </label>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          {[['public','🌍','Public'],['friends','👥','Friends'],['private','🔒','Just Me']].map(([val, icon, lbl]) => (
            <TapCard key={val} value={val} selected={form.privacy} onClick={set('privacy')} icon={icon} label={lbl} />
          ))}
        </div>
      </div>

      {/* Preview card */}
      <div style={{
        padding: '1rem 1.25rem',
        background: 'linear-gradient(135deg, #0077B6 0%, #00B4D8 100%)',
        borderRadius: 'var(--radius-card)', color: '#fff',
      }}>
        <p style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '0.25rem' }}>DIVE SUMMARY</p>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          {form.diveSiteName || 'Unnamed Site'} · {form.country || '?'}
        </h3>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', opacity: 0.9, flexWrap: 'wrap' }}>
          {form.diveDate && <span>📅 {form.diveDate}</span>}
          {form.maxDepthM && <span>📏 {form.maxDepthM}m</span>}
          {form.durationMin && <span>⏱ {form.durationMin} min</span>}
          {form.visibility && <span>👁 {VISIBILITY_OPTIONS.find((v) => v.value === form.visibility)?.label}</span>}
        </div>
        {animals.length > 0 && (
          <div style={{ marginTop: '0.5rem', fontSize: '1.2rem' }}>
            {animals.slice(0, 8).map((a) => a.emoji).join(' ')}
            {animals.length > 8 && <span style={{ fontSize: '0.8rem', opacity: 0.8 }}> +{animals.length - 8} more</span>}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main LogDive page ────────────────────────────────────────────────────────

const INITIAL_FORM = {
  diveSiteId: null, diveSiteName: '', country: '',
  diveDate: TODAY, entryTime: '', exitTime: '', entryType: '',
  maxDepthM: '', avgDepthM: '', durationMin: '',
  surfaceIntervalMin: '', pressureStartBar: '', pressureEndBar: '',
  waterType: '', bodyOfWater: '', airTempC: '', waterTempSurfaceC: '', waterTempBottomC: '',
  visibility: '', visibilityM: '', current: '',
  wetsuitType: '', weightKg: '', weightFeeling: '',
  gearHood: false, gearGloves: false, gearBoots: false, gearTorch: false,
  gearCamera: false, gearComputer: false, gearScooter: false,
  cylinderMaterial: '', cylinderVolumeL: '', gasMixture: '', gasO2Percent: '',
  notes: '',
  siteRating: 0, siteReview: '', shopName: '', shopRating: 0, shopReview: '',
  divemasterName: '', divemasterRating: 0, divemasterReview: '',
  privacy: 'public',
}

const keyframes = `
  @keyframes slideInRight { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes slideInLeft  { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes bounceIn { 0% { transform: scale(0.8); opacity: 0; } 60% { transform: scale(1.05); } 100% { transform: scale(1); opacity: 1; } }
`

export default function LogDive() {
  const { token, user } = useAuth()
  const navigate = useNavigate()

  const [step, setStep]       = useState(1)
  const [direction, setDir]   = useState('right')
  const [form, setForm]       = useState(INITIAL_FORM)
  const [animals, setAnimals] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

  const canProceed = () => {
    if (step === 1) return form.diveSiteName.trim() && form.country.trim() && form.diveDate
    return true
  }

  const goNext = () => {
    if (!canProceed()) return
    setDir('right')
    setStep((s) => Math.min(6, s + 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goBack = () => {
    setDir('left')
    setStep((s) => Math.max(1, s - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submit = async () => {
    if (!form.diveSiteName.trim() || !form.country.trim() || !form.diveDate) {
      setError('Please fill in dive site, country, and date.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      // Add divemaster to companions if named and not already added
      let companions = [...form.companions]
      if (form.divemasterName.trim()) {
        const already = companions.some((c) => c.role === 'divemaster')
        if (!already) {
          companions.push({ userId: null, name: form.divemasterName.trim(), role: 'divemaster', verified: false })
        }
      }

      const payload = {
        form: { ...form, companions: undefined },
        animals: animals.map((a) => ({
          speciesId: a.speciesId || null,
          customName: a.customName || null,
          count: a.count || 1,
        })),
        companions,
      }

      const { logId } = await apiDiveLogCreate(token, payload)
      setSuccess(true)
      setTimeout(() => navigate(`/dive/${logId}`), 1800)
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  const stepProps = { form, setForm, animals, setAnimals, token }

  if (success) {
    return (
      <>
        <style>{keyframes}</style>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: 'calc(100dvh - 60px)', fontFamily: 'var(--font-main)', gap: '1rem',
          animation: 'bounceIn 0.6s ease',
        }}>
          <span style={{ fontSize: '4rem' }}>🤿</span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-deep)' }}>Dive logged!</h2>
          <p style={{ color: 'var(--color-muted)' }}>Taking you to your dive log…</p>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{keyframes}</style>
      <DepthGauge step={step} />
      <div style={{
        maxWidth: '600px', margin: '0 auto', padding: '1.5rem 1.25rem 6rem',
        fontFamily: 'var(--font-main)',
        animation: `${direction === 'right' ? 'slideInRight' : 'slideInLeft'} 0.28s ease`,
      }}>
        {/* Step header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{
              flex: 1, height: '4px', borderRadius: '2px',
              background: i < step ? 'var(--color-turquoise)' : i === step - 1 ? 'var(--color-turquoise)' : 'var(--color-border)',
              transition: 'background 0.3s ease',
            }} />
          ))}
        </div>
        <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-muted)', marginBottom: '1.5rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Step {step} of {STEPS.length} · {STEPS[step - 1].icon} {STEPS[step - 1].label}
        </p>

        {/* Step content */}
        {step === 1 && <Step1 {...stepProps} />}
        {step === 2 && <Step2 {...stepProps} />}
        {step === 3 && <Step3 {...stepProps} />}
        {step === 4 && <Step4 {...stepProps} />}
        {step === 5 && <Step5 {...stepProps} />}
        {step === 6 && <Step6 {...stepProps} />}

        {/* Error */}
        {error && (
          <div style={{
            marginTop: '1rem', padding: '0.75rem 1rem', background: 'var(--color-error-light)',
            border: '1px solid #FCA5A5', borderRadius: 'var(--radius-md)',
            color: 'var(--color-error)', fontSize: '0.875rem',
          }}>{error}</div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
          {step > 1 && (
            <button type="button" onClick={goBack}
              style={{
                flex: 1, padding: '0.85rem', borderRadius: 'var(--radius-md)',
                background: 'var(--color-surface)', border: '2px solid var(--color-border)',
                fontSize: '1rem', fontWeight: 700, color: 'var(--color-muted)',
                cursor: 'pointer', fontFamily: 'var(--font-main)',
              }}>← Back</button>
          )}
          {step < 6 ? (
            <button type="button" onClick={goNext} disabled={!canProceed()}
              style={{
                flex: 2, padding: '0.85rem', borderRadius: 'var(--radius-md)',
                background: canProceed() ? 'var(--color-turquoise)' : 'var(--color-border)',
                border: 'none', fontSize: '1rem', fontWeight: 800,
                color: canProceed() ? '#fff' : 'var(--color-muted)',
                cursor: canProceed() ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-main)',
                boxShadow: canProceed() ? '0 4px 14px rgba(0,180,216,0.35)' : 'none',
                transition: 'all var(--transition)',
              }}>
              {step === 3 ? 'Next — Wildlife 🐠' : step === 4 ? 'Next — The Crew 👥' : 'Next →'}
            </button>
          ) : (
            <button type="button" onClick={submit} disabled={submitting}
              style={{
                flex: 2, padding: '0.95rem', borderRadius: 'var(--radius-md)',
                background: submitting ? 'var(--color-border)' : 'var(--color-coral)',
                border: 'none', fontSize: '1.05rem', fontWeight: 800,
                color: submitting ? 'var(--color-muted)' : '#fff',
                cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-main)',
                boxShadow: submitting ? 'none' : 'var(--shadow-btn)',
                transition: 'all var(--transition)',
              }}>
              {submitting ? '🤿 Logging...' : '🤿 Log This Dive!'}
            </button>
          )}
        </div>

        {/* Skip hint */}
        {step < 6 && step > 1 && (
          <p style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--color-muted)' }}>
            All fields except site + date are optional — skip anytime
          </p>
        )}
      </div>
    </>
  )
}
