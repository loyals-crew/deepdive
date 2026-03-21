export default function Select({ label, name, value, onChange, error, options = [] }) {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  }

  const labelStyle = {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: error ? 'var(--color-error)' : 'var(--color-deep)',
  }

  const selectStyle = {
    width: '100%',
    padding: '0.75rem 2.5rem 0.75rem 1rem',
    border: `2px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
    borderRadius: 'var(--radius-md)',
    fontSize: '1rem',
    color: value ? 'var(--color-deep)' : 'var(--color-muted)',
    background: `var(--color-surface) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%237A9BAD' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E") no-repeat right 0.75rem center`,
    appearance: 'none',
    outline: 'none',
    cursor: 'pointer',
    transition: 'border-color var(--transition), box-shadow var(--transition)',
  }

  const focusStyle = `
    select[name="${name}"]:focus {
      border-color: var(--color-turquoise);
      box-shadow: 0 0 0 3px rgba(0,180,216,0.15);
    }
  `

  const errorStyle = {
    fontSize: '0.8rem',
    color: 'var(--color-error)',
    fontWeight: '500',
  }

  return (
    <div style={containerStyle}>
      <style>{focusStyle}</style>
      {label && <label htmlFor={name} style={labelStyle}>{label}</label>}
      <select id={name} name={name} value={value} onChange={onChange} style={selectStyle}>
        <option value="" disabled>Select your level</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  )
}
