import { useState } from 'react'
import { verifyPassword } from '../lib/crypto'

export default function PasswordModal({ listTitle, correctHash, onConfirm, onCancel }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const ok = await verifyPassword(password, correctHash)
    if (ok) {
      onConfirm()
    } else {
      setError('Nieprawidłowe hasło. Spróbuj ponownie.')
    }
    setLoading(false)
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Lista chroniona hasłem</h2>
        <p>Aby wyświetlić listę <strong>{listTitle}</strong>, wpisz hasło dostępu.</p>
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Hasło dostępu</label>
            <input
              type="password"
              placeholder="Hasło..."
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              autoFocus
            />
            {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 6 }}>{error}</p>}
          </div>
          <div className="modal-actions">
            {onCancel && <button type="button" className="btn btn-secondary" onClick={onCancel}>Anuluj</button>}
            <button type="submit" className="btn btn-primary" disabled={loading || !password}>
              {loading ? <span className="spinner" style={{width:16,height:16}} /> : 'Odblokuj'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
