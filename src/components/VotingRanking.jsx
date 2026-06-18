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

function SortableItem({ id, rank, title, closed }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`drag-item ${isDragging ? 'dragging' : ''}`}
      {...attributes}
      {...(!closed ? listeners : {})}
    >
      <span className="drag-handle">{closed ? '' : '⠿'}</span>
      <span className="drag-rank">{rank}</span>
      <span style={{ fontSize: 14, flex: 1 }}>{title}</span>
    </div>
  )
}

export default function VotingRanking({ listId, items, votes, uuid, nick, closed }) {
  const approvedItems = items.filter(i => i.approved !== false)
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
      const removed = new Set(newIds.filter(id => !approvedItems.find(i => i.id === id)))
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

  const { scores, voterDetails } = computeRankingResults(votes, approvedItems)
  const maxScore = Math.max(1, ...Object.values(scores))

  const getTitle = (id) => approvedItems.find(i => i.id === id)?.title || id

  return (
    <div>
      {!closed && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 10 }}>
            Przeciągnij elementy, żeby ułożyć je od najbardziej do najmniej lubianego. Zmiany zapisują się automatycznie.
          </p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={order} strategy={verticalListSortingStrategy}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {order.map((id, idx) => (
                  <SortableItem key={id} id={id} rank={idx + 1} title={getTitle(id)} closed={closed} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {Object.keys(scores).length > 0 && (
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
