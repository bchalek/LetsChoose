import { useState } from 'react'
import { addComment, deleteComment } from '../lib/db'

function formatTime(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function CommentsSection({ listId, itemId, comments, uuid, nick, isAdmin }) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [open, setOpen] = useState(false)

  const itemComments = comments.filter(c => c.itemId === itemId)

  async function submit(e) {
    e.preventDefault()
    if (!text.trim() || !nick) return
    setSending(true)
    await addComment(listId, { itemId, text: text.trim(), author: nick, authorUuid: uuid })
    setText('')
    setSending(false)
  }

  async function remove(commentId) {
    await deleteComment(listId, commentId)
  }

  return (
    <div className="comments-section">
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => setOpen(o => !o)}
        style={{ marginBottom: open ? 10 : 0 }}
      >
        💬 {itemComments.length > 0 ? `${itemComments.length} komentarz${itemComments.length === 1 ? '' : itemComments.length < 5 ? 'e' : 'y'}` : 'Komentarze'} {open ? '▲' : '▼'}
      </button>

      {open && (
        <div>
          {itemComments.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 8 }}>Brak komentarzy.</p>
          )}
          {itemComments.map(c => (
            <div key={c.id} className="comment">
              <div className="comment-avatar">
                {c.author?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="comment-content">
                <div className="comment-meta">
                  <span className="comment-nick">{c.author}</span>
                  <span className="comment-time">{formatTime(c.createdAt)}</span>
                  {(isAdmin || c.authorUuid === uuid) && (
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '0 4px', fontSize: 12 }}
                      onClick={() => remove(c.id)}
                    >×</button>
                  )}
                </div>
                <div className="comment-text">{c.text}</div>
              </div>
            </div>
          ))}

          {nick && (
            <form onSubmit={submit} className="comment-form">
              <input
                className="form-group"
                style={{ margin: 0, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', padding: '8px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', flex: 1 }}
                placeholder="Napisz komentarz..."
                value={text}
                onChange={e => setText(e.target.value)}
                maxLength={500}
              />
              <button type="submit" className="btn btn-primary btn-sm" disabled={sending || !text.trim()}>
                Wyślij
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
