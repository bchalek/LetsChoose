import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useList, useItems, useVotes, useComments } from '../hooks/useList'
import { useIdentity } from '../hooks/useIdentity'
import { updateItem, deleteItem } from '../lib/db'
import NickModal from '../components/NickModal'
import PasswordModal from '../components/PasswordModal'
import ItemCard from '../components/ItemCard'
import AddItemForm from '../components/AddItemForm'
import VotingRanking from '../components/VotingRanking'
import { showToast } from '../components/Toast'

function formatExpiry(ts) {
  if (!ts) return null
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleString('pl-PL', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
}

export default function ListPage() {
  const { listId } = useParams()
  const list = useList(listId)
  const items = useItems(listId)
  const votes = useVotes(listId)
  const comments = useComments(listId)
  const { uuid, nick, setNick } = useIdentity(listId)

  const [passwordOk, setPasswordOk] = useState(false)

  useEffect(() => {
    const saved = sessionStorage.getItem(`lc_pw_${listId}`)
    if (saved === 'ok') setPasswordOk(true)
  }, [listId])

  if (list === undefined) {
    return <div className="loading-page"><div className="spinner" /><span>Ładowanie...</span></div>
  }
  if (list === null) {
    return <div className="page"><h2>Lista nie istnieje.</h2><Link to="/">← Strona główna</Link></div>
  }

  if (list.passwordHash && !passwordOk) {
    return (
      <PasswordModal
        listTitle={list.title}
        correctHash={list.passwordHash}
        onConfirm={() => { sessionStorage.setItem(`lc_pw_${listId}`, 'ok'); setPasswordOk(true) }}
      />
    )
  }

  if (!nick) {
    return <NickModal listTitle={list.title} onConfirm={setNick} />
  }

  const isAdmin = localStorage.getItem(`lc_admin_${listId}`) === list.adminToken
  const closed = list.closed || (list.expiresAt && list.expiresAt.toDate?.() < new Date())
  const approvedItems = items.filter(i => i.approved !== false || isAdmin)

  async function handleApprove(itemId) {
    await updateItem(listId, itemId, { approved: true })
    showToast('Element zatwierdzony.')
  }

  async function handleDelete(itemId) {
    await deleteItem(listId, itemId)
    showToast('Element usunięty.')
  }

  const pendingCount = items.filter(i => i.approved === false).length

  return (
    <div className="page">
      <div className="list-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <h1>{list.title}</h1>
          {isAdmin && (
            <Link to={`/list/${listId}/admin?token=${list.adminToken}`} className="btn btn-secondary btn-sm">
              ⚙ Panel admina
            </Link>
          )}
        </div>
        <div className="list-header-meta">
          {list.passwordHash && <span className="badge badge-purple">🔒 Chroniona</span>}
          {closed && <span className="badge badge-red">Zamknięta</span>}
          {!closed && <span className="badge badge-green">Aktywna</span>}
          {list.votingMode === 'likes' && <span className="badge badge-gray">♥ Lajki</span>}
          {list.votingMode === 'topN' && <span className="badge badge-gray">★ Top {list.topN}</span>}
          {list.votingMode === 'ranking' && <span className="badge badge-gray">⠿ Ranking</span>}
          {isAdmin && pendingCount > 0 && (
            <span className="badge badge-orange">⏳ {pendingCount} oczekujących</span>
          )}
        </div>
        {list.description && <p>{list.description}</p>}
        {list.expiresAt && (
          <p className="text-sm text-muted" style={{ marginTop: 4 }}>
            {closed ? '⏱ Głosowanie zakończone' : `⏱ Głosowanie do: ${formatExpiry(list.expiresAt)}`}
          </p>
        )}
      </div>

      {list.votingMode === 'ranking' && approvedItems.filter(i => i.approved !== false).length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="section-title" style={{ marginBottom: 16 }}>Ułóż ranking</div>
          <VotingRanking
            listId={listId}
            items={approvedItems}
            votes={votes}
            uuid={uuid}
            nick={nick}
            closed={closed}
          />
        </div>
      )}

      {list.votingMode !== 'ranking' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {approvedItems.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
              <p className="text-muted">Brak elementów na liście.{list.allowAdd ? ' Dodaj pierwszy!' : ''}</p>
            </div>
          )}
          {approvedItems.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              list={list}
              votes={votes}
              comments={comments}
              uuid={uuid}
              nick={nick}
              isAdmin={isAdmin}
              onApprove={handleApprove}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {list.votingMode === 'ranking' && approvedItems.filter(i => i.approved !== false).length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p className="text-muted">Brak elementów na liście.{list.allowAdd ? ' Dodaj pierwszy!' : ''}</p>
        </div>
      )}

      {list.votingMode === 'ranking' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          {items.filter(i => i.approved === false && isAdmin).map(item => (
            <ItemCard
              key={item.id}
              item={item}
              list={list}
              votes={votes}
              comments={comments}
              uuid={uuid}
              nick={nick}
              isAdmin={isAdmin}
              onApprove={handleApprove}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {list.allowAdd && !closed && (
        <AddItemForm listId={listId} nick={nick} addedBy={uuid} moderation={list.moderation} />
      )}
    </div>
  )
}
