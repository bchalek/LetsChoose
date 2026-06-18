export default function ResultsBar({ value, max, label, voters }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0

  return (
    <div className="results-bar">
      <div className="results-bar-label">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="results-bar-track">
        <div className="results-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      {voters && voters.length > 0 && (
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>
          {voters.join(', ')}
        </div>
      )}
    </div>
  )
}
