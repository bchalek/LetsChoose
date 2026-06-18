import { useState } from 'react'
import { addItem } from '../lib/db'
import { uploadImage } from '../lib/storage'
import { showToast } from './Toast'

function safeUrl(u) {
  try {
    const { protocol } = new URL(u)
    return ['http:', 'https:'].includes(protocol) ? u : null
  } catch {
    return null
  }
}

export default function AddItemForm({ listId, nick, addedBy, moderation }) {
  const [type, setType] = useState('link')
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [desc, setDesc] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    setError('')
    try {
      let imageUrl = null
      if (type === 'image' && imageFile) {
        imageUrl = await uploadImage(listId, imageFile)
      }
      await addItem(listId, {
        type,
        title: title.trim(),
        description: desc.trim() || null,
        url: type === 'link' ? safeUrl(url.trim()) : null,
        imageUrl,
        addedBy: nick || addedBy,
        addedByUuid: addedBy,
        approved: !moderation,
      })
      showToast(moderation ? 'Dodano — czeka na zatwierdzenie przez autora.' : 'Dodano element!')
      setTitle(''); setUrl(''); setDesc(''); setImageFile(null); setPreview(null)
      setOpen(false)
    } catch (err) {
      setError(`Błąd: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  function handleImage(e) {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  if (!open) {
    return (
      <button className="btn btn-secondary btn-block mt-4" onClick={() => setOpen(true)}>
        + Dodaj element do listy
      </button>
    )
  }

  return (
    <div className="card mt-4">
      <div className="section-title">Dodaj element</div>
      <div className="type-tabs">
        {['link', 'text', 'image'].map(t => (
          <button
            key={t}
            className={`type-tab ${type === t ? 'active' : ''}`}
            onClick={() => setType(t)}
          >
            {t === 'link' ? '🔗 Link' : t === 'text' ? '📝 Tekst' : '🖼 Zdjęcie'}
          </button>
        ))}
      </div>
      <form onSubmit={submit}>
        <div className="form-group">
          <label>Tytuł *</label>
          <input placeholder="Nazwa/tytuł..." value={title} onChange={e => setTitle(e.target.value)} maxLength={120} />
        </div>
        {type === 'link' && (
          <div className="form-group">
            <label>URL</label>
            <input type="url" placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} />
          </div>
        )}
        {type === 'image' && (
          <div className="form-group">
            <label>Zdjęcie</label>
            <input type="file" accept="image/*" onChange={handleImage} />
            {preview && <img src={preview} alt="podgląd" style={{ marginTop: 8, maxHeight: 200, borderRadius: 8, width: '100%', objectFit: 'cover' }} />}
          </div>
        )}
        <div className="form-group">
          <label>Opis (opcjonalnie)</label>
          <textarea placeholder="Dlaczego to polecasz..." value={desc} onChange={e => setDesc(e.target.value)} maxLength={500} />
        </div>
        {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 10 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" className="btn btn-primary" disabled={saving || !title.trim()}>
            {saving ? <><span className="spinner" style={{width:14,height:14}} /> Dodawanie...</> : 'Dodaj'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Anuluj</button>
        </div>
      </form>
    </div>
  )
}
