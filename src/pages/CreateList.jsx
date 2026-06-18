import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createList, addItem } from '../lib/db'
import { hashPassword, generateAdminToken, generateId } from '../lib/crypto'
import { showToast } from '../components/Toast'

export default function CreateList() {
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [access, setAccess] = useState('public')
  const [password, setPassword] = useState('')
  const [votingMode, setVotingMode] = useState('likes')
  const [topN, setTopN] = useState(3)
  const [allowAdd, setAllowAdd] = useState(true)
  const [moderation, setModeration] = useState(false)
  const [hasExpiry, setHasExpiry] = useState(false)
  const [expiresAt, setExpiresAt] = useState('')
  const [saving, setSaving] = useState(false)

  const uuid = (() => {
    let id = localStorage.getItem('lc_uuid')
    if (!id) { id = generateId(); localStorage.setItem('lc_uuid', id) }
    return id
  })()

  async function submit(e) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      const adminToken = generateAdminToken()
      let passwordHash = null
      if (access === 'password' && password) {
        passwordHash = await hashPassword(password)
      }
      const listData = {
        title: title.trim(),
        description: desc.trim() || null,
        passwordHash,
        votingMode,
        topN: votingMode === 'topN' ? topN : null,
        allowAdd,
        moderation: allowAdd ? moderation : false,
        expiresAt: hasExpiry && expiresAt ? new Date(expiresAt) : null,
        createdBy: uuid,
        adminToken,
      }
      const listId = await createList(listData)
      localStorage.setItem(`lc_admin_${listId}`, adminToken)
      showToast('Lista utworzona!')
      navigate(`/list/${listId}/admin?token=${adminToken}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <h1 style={{ marginBottom: 4 }}>Nowa lista</h1>
      <p className="text-muted text-sm" style={{ marginBottom: 28 }}>Wypełnij poniższe pola i udostępnij link znajomym.</p>

      <form onSubmit={submit}>
        <div className="section-title">Podstawowe</div>
        <div className="form-group">
          <label>Tytuł listy *</label>
          <input placeholder="np. Prezent dla Mamy, Wakacje 2025..." value={title} onChange={e => setTitle(e.target.value)} maxLength={100} autoFocus />
        </div>
        <div className="form-group">
          <label>Opis (opcjonalnie)</label>
          <textarea placeholder="Kilka słów o liście..." value={desc} onChange={e => setDesc(e.target.value)} maxLength={400} />
        </div>

        <hr className="divider" />
        <div className="section-title">Dostęp</div>
        <div className="radio-group form-group">
          {[
            { val: 'public', icon: '🌐', label: 'Publiczna', desc: 'Każdy z linkiem może zobaczyć listę' },
            { val: 'password', icon: '🔒', label: 'Chroniona hasłem', desc: 'Wymagane hasło aby wejść na listę' },
          ].map(opt => (
            <label key={opt.val} className={`radio-option ${access === opt.val ? 'selected' : ''}`}>
              <input type="radio" name="access" value={opt.val} checked={access === opt.val} onChange={() => setAccess(opt.val)} />
              <div>
                <div className="radio-option-label">{opt.icon} {opt.label}</div>
                <div className="radio-option-desc">{opt.desc}</div>
              </div>
            </label>
          ))}
        </div>
        {access === 'password' && (
          <div className="form-group">
            <label>Hasło dostępu</label>
            <input type="password" placeholder="Hasło..." value={password} onChange={e => setPassword(e.target.value)} />
          </div>
        )}

        <hr className="divider" />
        <div className="section-title">Tryb głosowania</div>
        <div className="radio-group form-group">
          {[
            { val: 'likes', icon: '♥', label: 'Lajki', desc: 'Każdy może polubić dowolną liczbę elementów' },
            { val: 'topN', icon: '★', label: 'Top N', desc: 'Każdy wybiera swoje N ulubionych' },
            { val: 'ranking', icon: '⠿', label: 'Ranking', desc: 'Każdy układa wszystkie elementy od najlepszego' },
          ].map(opt => (
            <label key={opt.val} className={`radio-option ${votingMode === opt.val ? 'selected' : ''}`}>
              <input type="radio" name="votingMode" value={opt.val} checked={votingMode === opt.val} onChange={() => setVotingMode(opt.val)} />
              <div>
                <div className="radio-option-label">{opt.icon} {opt.label}</div>
                <div className="radio-option-desc">{opt.desc}</div>
              </div>
            </label>
          ))}
        </div>
        {votingMode === 'topN' && (
          <div className="form-group">
            <label>Ile może wybrać każda osoba? (N)</label>
            <input type="number" min={1} max={20} value={topN} onChange={e => setTopN(Number(e.target.value))} style={{ maxWidth: 100 }} />
          </div>
        )}

        <hr className="divider" />
        <div className="section-title">Uprawnienia i moderacja</div>
        <div className="check-group form-group">
          <label className={`check-option ${allowAdd ? 'selected' : ''}`}>
            <input type="checkbox" checked={allowAdd} onChange={e => setAllowAdd(e.target.checked)} />
            <div>
              <div className="radio-option-label">Goście mogą dodawać elementy</div>
              <div className="radio-option-desc">Odwiedzający mogą proponować własne opcje</div>
            </div>
          </label>
          {allowAdd && (
            <label className={`check-option ${moderation ? 'selected' : ''}`}>
              <input type="checkbox" checked={moderation} onChange={e => setModeration(e.target.checked)} />
              <div>
                <div className="radio-option-label">Moderacja — wymagam zatwierdzenia</div>
                <div className="radio-option-desc">Nowe elementy pojawią się dopiero po Twojej akceptacji</div>
              </div>
            </label>
          )}
        </div>

        <hr className="divider" />
        <div className="section-title">Czas trwania</div>
        <div className="check-group form-group">
          <label className={`check-option ${hasExpiry ? 'selected' : ''}`}>
            <input type="checkbox" checked={hasExpiry} onChange={e => setHasExpiry(e.target.checked)} />
            <div>
              <div className="radio-option-label">Ustaw datę zakończenia głosowania</div>
              <div className="radio-option-desc">Po tym terminie lista będzie tylko do odczytu</div>
            </div>
          </label>
        </div>
        {hasExpiry && (
          <div className="form-group">
            <label>Data zakończenia</label>
            <input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={saving || !title.trim()}>
          {saving ? <><span className="spinner" style={{width:16,height:16}} /> Tworzę listę...</> : 'Utwórz listę →'}
        </button>
      </form>
    </div>
  )
}
