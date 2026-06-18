import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { setVote } from '../lib/db'
import { computeRankingResults } from '../lib/votes'
import ResultsBar from './ResultsBar'
import CommentsSection from './CommentsSection'

function safeUrl(u) {
  try {
    const { protocol } = new URL(u)
    return ['http:', 'https:'].includes(protocol) ? u : null
  } catch { return null }
}

function SortableCard({ id, rank, item, list, comments, uuid, nick, isAdmin, closed, onApprove, onDelete, onToggleDone }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const isDone = item.done === true
  const isPending = item.approved === false

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : undefined }}
      {...attributes}
      className={`item-card ${isDone ? 'done' : ''} ${isDragging ? 'dragging' : ''} ${isPending ? 'pending' : ''}`}
    >
      {!isPending && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 16px', borderBottom: '1px solid var(--border)',
            background: 'var(--bg3)', cursor: closed ? 'default' : 'grab',
            userSelect: 'none',
          }}
          {...(!closed ? listeners : {})}
        >
          {!closed && <span style={{ color: 'var(--text3)', fontSize: 18, lineHeight: 1 }}>⠿</span>}
          <span className="drag-rank">{rank}</span>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>
            {closed ? 'wynik rankingu' : 'przeciągnij żeby zmienić kolejność'}
          </span>
        </div>
      )}

      {item.imageUrl && (
        <img src={item.imageUrl} alt={item.title} className="item-card-image" />
      )}

      <div className="item-card-body">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div className="item-card-title">{item.title}</div>
          {isDone && <span className="badge badge-green" style={{ flexShrink: 0 }}>✓ Zrealizowane</span>}
          {isPending && <span className="badge badge-orange" style={{ flexShrink: 0 }}>Oczekuje</span>}
        </div>
        {item.description && <div className="item-card-desc">{item.description}</div>}
        {safeUrl(item.url) && (
          <a href={safeUrl(item.url)} target="_blank" rel="noopener noreferrer" className="item-card-link">
            🔗 {item.url.replace(/^https?:\/\//, '').split('/')[0]}
          </a>
        )}
        {isPending && isAdmin && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="btn btn-success btn-sm" onClick={() => onApprove(item.id)}>Zatwierdź</button>
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(item.id)}>Usuń</button>
          </div>
        )}
        {isPending && !isAdmin && (
          <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 8 }}>Oczekuje na zatwierdzenie przez autora.</p>
        )}
      </div>

      {!isPending && (
        <div className="item-card-footer">
          <span className="item-card-added-by">Dodano przez <strong>{item.addedBy}</strong></span>
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

export default function VotingRanking({ listId, list, items, votes, comments, uuid, nick, closed, isAdmin, onApprove, onDelete, onToggleDone }) {
  const approvedItems = items.filter(i => i.approved !== false)
  const pendingItems = items.filter(i => i.approved === false)
  const myVote = votes.find(v => v.id === uuid)

  const [order, setOrder] = useState(() => {
    if (myVote?.ranking) {
      const sorted = [...approvedItems].sort(
        (a, b) => (myVote.ranking[a.id] ?? 999) - (myVote.ranking[b.id] ?? 999)
      )
      return sorted.map(i => i.id)
    }
    return approvedItems.map(i => i.id)
  })

  useEffect(() => {
    setOrder(prev => {
      const existing = new Set(prev)
      const newIds = approvedItems.map(i => i.id)
      const added = newIds.filter(id => !existing.has(id))
      const removed = new Set(prev.filter(id => !newIds.includes(id)))
      return [...prev.filter(id => !removed.has(id)), ...added]
    })
  }, [items])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  async function handleDragEnd(event) {
    if (closed) return
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = order.indexOf(active.id)
    const newIndex = order.indexOf(over.id)
    const newOrder = arrayMove(order, oldIndex, newIndex)
    setOrder(newOrder)
    const ranking = {}
    newOrder.forEach((id, idx) => { ranking[id] = idx + 1 })
    await setVote(listId, uuid, { nick, ranking })
  }

  const getItem = (id) => approvedItems.find(i => i.id === id)

  const { scores, voterDetails } = computeRankingResults(votes, approvedItems)
  const maxScore = Math.max(1, ...Object.values(scores))

  if (approvedItems.length === 0 && pendingItems.length === 0) return null

  return (
    <div>
      {!closed && approvedItems.length > 0 && (
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>
          Przeciągnij karty za pasek u góry, żeby ułożyć je od najbardziej do najmniej lubianego. Zmiany zapisują się automatycznie.
        </p>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {order.map((id, idx) => {
              const item = getItem(id)
              if (!item) return null
              return (
                <SortableCard
                  key={id}
                  id={id}
                  rank={idx + 1}
                  item={item}
                  list={list}
                  comments={comments}
                  uuid={uuid}
                  nick={nick}
                  isAdmin={isAdmin}
                  closed={closed}
                  onApprove={onApprove}
                  onDelete={onDelete}
                  onToggleDone={onToggleDone}
                />
              )
            })}
          </div>
        </SortableContext>
      </DndContext>

      {isAdmin && pendingItems.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          {pendingItems.map(item => (
            <SortableCard
              key={item.id}
              id={item.id}
              rank={0}
              item={item}
              list={list}
              comments={comments}
              uuid={uuid}
              nick={nick}
              isAdmin={isAdmin}
              closed={closed}
              onApprove={onApprove}
              onDelete={onDelete}
              onToggleDone={onToggleDone}
            />
          ))}
        </div>
      )}

      {Object.keys(scores).length > 0 && (
        <div style={{ marginTop: 24, padding: '16px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Wyniki zbiorcze ({votes.length} {votes.length === 1 ? 'osoba' : votes.length < 5 ? 'osoby' : 'osób'})
          </p>
          {[...approvedItems]
            .sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0))
            .map(item => (
              <ResultsBar
                key={item.id}
                value={scores[item.id] || 0}
                max={maxScore}
                label={item.title}
                voters={(voterDetails[item.id] || []).map(v => `${v.nick} (#${v.position})`)}
              />
            ))
          }
        </div>
      )}
    </div>
  )
}
