import VotingLikes from './VotingLikes'
import VotingTopN from './VotingTopN'
import CommentsSection from './CommentsSection'

function safeUrl(u) {
  try {
    const { protocol } = new URL(u)
    return ['http:', 'https:'].includes(protocol) ? u : null
  } catch {
    return null
  }
}

export default function ItemCard({ item, list, votes, comments, uuid, nick, isAdmin, onApprove, onDelete, onToggleDone }) {
  const isPending = item.approved === false
  const isDone = item.done === true
  const closed = list.closed || (list.expiresAt && list.expiresAt.toDate?.() < new Date())

  return (
    <div className={`item-card ${isPending ? 'pending' : ''} ${isDone ? 'done' : ''}`}>
      {item.imageUrl && (
        <img src={item.imageUrl} alt={item.title} className="item-card-image" />
      )}
      <div className="item-card-body">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div className="item-card-title">{item.title}</div>
          {isDone && <span className="badge badge-green" style={{ flexShrink: 0 }}>✓ Zrealizowane</span>}
        </div>
        {item.description && <div className="item-card-desc">{item.description}</div>}
        {safeUrl(item.url) && (
          <a href={safeUrl(item.url)} target="_blank" rel="noopener noreferrer" className="item-card-link">
            🔗 {item.url.replace(/^https?:\/\//, '').split('/')[0]}
          </a>
        )}

        {isPending ? (
          <div style={{ marginTop: 10 }}>
            {isAdmin ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="badge badge-orange">Oczekuje na zatwierdzenie</span>
                <button className="btn btn-success btn-sm" onClick={() => onApprove(item.id)}>Zatwierdź</button>
                <button className="btn btn-danger btn-sm" onClick={() => onDelete(item.id)}>Usuń</button>
              </div>
            ) : (
              <span className="badge badge-orange">Oczekuje na zatwierdzenie</span>
            )}
          </div>
        ) : (
          !isDone && (
            <div style={{ marginTop: 12 }}>
              {list.votingMode === 'likes' && (
                <VotingLikes listId={list.id} itemId={item.id} votes={votes} uuid={uuid} nick={nick} closed={closed} />
              )}
              {list.votingMode === 'topN' && (
                <VotingTopN listId={list.id} itemId={item.id} votes={votes} uuid={uuid} nick={nick} topN={list.topN || 3} closed={closed} />
              )}
            </div>
          )
        )}
      </div>

      {!isPending && (
        <div className="item-card-footer">
          <span className="item-card-added-by">
            Dodano przez <strong>{item.addedBy}</strong>
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            {isAdmin && onToggleDone && (
              <button
                className={`btn btn-sm ${isDone ? 'btn-secondary' : 'btn-success'}`}
                onClick={() => onToggleDone(item.id, isDone)}
              >
                {isDone ? '↩ Cofnij' : '✓ Zrealizowane'}
              </button>
            )}
            {isAdmin && (
              <button className="btn btn-ghost btn-sm" onClick={() => onDelete(item.id)}>× Usuń</button>
            )}
          </div>
        </div>
      )}

      {!isPending && (
        <div style={{ padding: '0 16px 12px' }}>
          <CommentsSection
            listId={list.id}
            itemId={item.id}
            comments={comments}
            uuid={uuid}
            nick={nick}
            isAdmin={isAdmin}
          />
        </div>
      )}
    </div>
  )
}
