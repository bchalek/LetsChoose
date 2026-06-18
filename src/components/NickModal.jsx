import { useState } from 'react'

export default function NickModal({ listTitle, onConfirm }) {
  const [nick, setNick] = useState('')

  function submit(e) {
    e.preventDefault()
    const trimmed = nick.trim()
    if (!trimmed) return
    onConfirm(trimmed)
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Witaj na liście</h2>
        <p>Wpisz swoje imię lub nick, aby móc głosować i komentować na liście <strong>{listTitle}</strong>.</p>
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Twój nick</label>
            <input
              type="text"
              placeholder="np. Ania, Krzysztof..."
              value={nick}
              onChange={e => setNick(e.target.value)}
              autoFocus
              maxLength={32}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={!nick.trim()}>
            Wchodzę →
          </button>
        </form>
      </div>
    </div>
  )
}
