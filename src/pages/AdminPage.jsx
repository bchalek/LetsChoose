import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useList, useItems, useVotes, useComments } from '../hooks/useList'
import { updateList, updateItem, deleteItem, clearVotes } from '../lib/db'
import { computeLikesResults, computeTopNResults, computeRankingResults } from '../lib/votes'
import { showToast } from '../components/Toast'
import ItemCard from '../components/ItemCard'
import AddItemForm from '../components/AddItemForm'
import ResultsBar from '../components/ResultsBar'

export default function AdminPage() {
  const { listId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const list = useList(listId)
  const items = useItems(listId)
  const votes = useVotes(listId)
  const comments = useComments(listId)

  const [tab, setTab] = useState('items')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (list && token && token === list.adminToken) {
      localStorage.setItem(`lc_admin_${listId}`, token)
    }
  }, [list, token, listId])

  if (list === undefined) {
    return <div className="loading-page"><div className="spinner" /><span>Ładowanie...</span></div>
  }
  if (list === null) {
    return <div className="page"><h2>Lista nie istnieje.</h2><Link to="/">← Strona główna</Link></div>
  }

  const storedToken = localStorage.getItem(`lc_admin_${listId}`)
  if (!storedToken || storedToken !== list.adminToken) {
    return (
      <div className="page" style={{ textAlign: 'center', paddingTop: 80 }}>
        <h2>Brak dostępu</h2>
        <p className="text-muted" style={{ marginTop: 8 }}>Nie masz uprawnień do zarządzania tą listą.</p>
        <Link to={`/list/${listId}`} className="btn btn-secondary mt-4" style={{ display: 'inline-flex' }}>← Wróć do listy</Link>
      </div>
    )
  }

  const listUrl = `${window.location.origin}/list/${listId}`
  const adminUrl = `${window.location.origin}/list/${listId}/admin?token=${list.adminToken}`
  const closed = list.closed || (list.expiresAt && list.expiresAt.toDate?.() < new Date())

  async function copy(text) {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    showToast('Skopiowano!')
    setTimeout(() => setCopied(false), 2000)
  }

  async function toggleClose() {
    await updateList(listId, { closed: !list.closed })
    showToast(list.closed ? 'Lista otwarta.' : 'Lista zamknięta.')
  }

  async function handleClearVotes() {
    if (!confirm(`Usunąć wszystkie głosy (${votes.length})? Tej operacji nie można cofnąć.`)) return
    await clearVotes(listId)
    showToast('Wszystkie głosy zostały usunięte.')
  }

  async function handleApprove(itemId) {
    await updateItem(listId, itemId, { approved: true })
    showToast('Element zatwierdzony.')
  }

  async function handleDelete(itemId) {
    if (!confirm('Usunąć ten element?')) return
    await deleteItem(listId, itemId)
    showToast('Element usunięty.')
  }

  async function handleToggleDone(itemId, currentlyDone) {
    await updateItem(listId, itemId, { done: !currentlyDone })
    showToast(currentlyDone ? 'Oznaczono jako niezrealizowane.' : 'Oznaczono jako zrealizowane!')
  }

  const pendingItems = items.filter(i => i.approved === false)
  const approvedItems = items.filter(i => i.approved !== false)
  const doneCount = approvedItems.filter(i => i.done).length

  // Results summary
  let resultsData = []
  if (list.votingMode === 'likes') {
    const { counts, voters } = computeLikesResults(votes)
    resultsData = [...approvedItems]
      .sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0))
      .map(item => ({ item, value: counts[item.id] || 0, voters: voters[item.id] || [] }))
  } else if (list.votingMode === 'topN') {
    const { counts, voters } = computeTopNResults(votes)
    resultsData = [...approvedItems]
      .sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0))
      .map(item => ({ item, value: counts[item.id] || 0, voters: voters[item.id] || [] }))
  } else if (list.votingMode === 'ranking') {
    const { scores, voterDetails } = computeRankingResults(votes, approvedItems)
    resultsData = [...approvedItems]
      .sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0))
      .map(item => ({
        item,
        value: scores[item.id] || 0,
        voters: (voterDetails[item.id] || []).map(v => `${v.nick} (#${v.position})`)
      }))
  }
  const maxResult = Math.max(1, ...resultsData.map(r => r.value))

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
        <Link to={`/list/${listId}`} className="btn btn-ghost btn-sm">← Lista</Link>
        <h1 style={{ flex: 1 }}>{list.title}</h1>
        <span className="badge badge-purple">Panel admina</span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <button
          className={`btn btn-sm ${closed ? 'btn-success' : 'btn-danger'}`}
          onClick={toggleClose}
        >
          {closed ? '▶ Otwórz głosowanie' : '■ Zamknij głosowanie'}
        </button>
        {votes.length > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={handleClearVotes}>
            🗑 Usuń wszystkie głosy
          </button>
        )}
        {pendingItems.length > 0 && (
          <span className="badge badge-orange" style={{ alignSelf: 'center' }}>
            ⏳ {pendingItems.length} oczekujących
          </span>
        )}
      </div>

      <div className="admin-tabs">
        {[
          { key: 'items', label: `Elementy (${approvedItems.length - doneCount} pozostałych)` },
          { key: 'pending', label: `Oczekujące (${pendingItems.length})` },
          { key: 'results', label: `Wyniki (${votes.length} głosów)` },
          { key: 'share', label: 'Udostępnij' },
        ].map(t => (
          <button key={t.key} className={`admin-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'items' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {approvedItems.length === 0 && <p className="text-muted">Brak elementów.</p>}
          {[...approvedItems.filter(i => !i.done), ...approvedItems.filter(i => i.done)].map(item => (
            <ItemCard
              key={item.id}
              item={item}
              list={list}
              votes={votes}
              comments={comments}
              uuid=""
              nick="Admin"
              isAdmin
              onApprove={handleApprove}
              onDelete={handleDelete}
              onToggleDone={handleToggleDone}
            />
          ))}
          <AddItemForm listId={listId} nick="Admin" addedBy="admin" moderation={false} />
        </div>
      )}

      {tab === 'pending' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pendingItems.length === 0 && <p className="text-muted">Brak oczekujących elementów.</p>}
          {pendingItems.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              list={list}
              votes={votes}
              comments={comments}
              uuid=""
              nick="Admin"
              isAdmin
              onApprove={handleApprove}
              onDelete={handleDelete}
              onToggleDone={handleToggleDone}
            />
          ))}
        </div>
      )}

      {tab === 'results' && (
        <div>
          <p className="text-muted text-sm" style={{ marginBottom: 16 }}>
            {votes.length === 0 ? 'Nikt jeszcze nie głosował.' : `Zagłosowało ${votes.length} ${votes.length === 1 ? 'osoba' : votes.length < 5 ? 'osoby' : 'osób'}.`}
          </p>
          {resultsData.map(({ item, value, voters }) => (
            <div key={item.id} style={{ marginBottom: 12 }}>
              <ResultsBar
                value={value}
                max={maxResult}
                label={item.title}
                voters={voters}
              />
            </div>
          ))}

          {votes.length > 0 && (
            <>
              <hr className="divider" />
              <div className="section-title">Szczegóły głosów</div>
              {votes.map(v => (
                <div key={v.id} className="card" style={{ marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>{v.nick}</div>
                  {list.votingMode === 'likes' && (
                    <div className="text-sm text-muted">
                      Polubił: {(v.likes || []).map(id => approvedItems.find(i => i.id === id)?.title || id).join(', ') || '—'}
                    </div>
                  )}
                  {list.votingMode === 'topN' && (
                    <div className="text-sm text-muted">
                      Top {list.topN}: {(v.topN || []).map(id => approvedItems.find(i => i.id === id)?.title || id).join(', ') || '—'}
                    </div>
                  )}
                  {list.votingMode === 'ranking' && (
                    <div className="text-sm text-muted">
                      {Object.entries(v.ranking || {})
                        .sort((a, b) => a[1] - b[1])
                        .map(([id, pos]) => `#${pos} ${approvedItems.find(i => i.id === id)?.title || id}`)
                        .join(' • ') || '—'}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {tab === 'share' && (
        <div>
          <div className="form-group">
            <label>Link do listy (dla uczestników)</label>
            <div className="share-box">
              <input readOnly value={listUrl} />
              <button className="btn btn-secondary btn-sm" onClick={() => copy(listUrl)}>
                {copied ? '✓' : 'Kopiuj'}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>Link admina (tylko dla Ciebie)</label>
            <div className="share-box">
              <input readOnly value={adminUrl} />
              <button className="btn btn-secondary btn-sm" onClick={() => copy(adminUrl)}>
                {copied ? '✓' : 'Kopiuj'}
              </button>
            </div>
            <p className="text-sm text-muted mt-1">⚠ Nie udostępniaj tego linku — daje pełny dostęp do zarządzania listą.</p>
          </div>

          {list.passwordHash && (
            <div className="card" style={{ borderColor: 'var(--warning)' }}>
              <p className="text-sm">🔒 Lista jest chroniona hasłem. Pamiętaj przekazać je uczestnikom.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
