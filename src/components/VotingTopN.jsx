import { setVote } from '../lib/db'
import { computeTopNResults } from '../lib/votes'
import ResultsBar from './ResultsBar'

export default function VotingTopN({ listId, itemId, votes, uuid, nick, topN, closed }) {
  const myVote = votes.find(v => v.id === uuid)
  const myTopN = myVote?.topN || []
  const selected = myTopN.includes(itemId)
  const canAdd = myTopN.length < topN

  const { counts, voters } = computeTopNResults(votes)
  const maxCount = Math.max(1, ...Object.values(counts))
  const count = counts[itemId] || 0

  async function toggle() {
    if (closed) return
    let newTopN
    if (selected) {
      newTopN = myTopN.filter(id => id !== itemId)
    } else {
      if (!canAdd) return
      newTopN = [...myTopN, itemId]
    }
    await setVote(listId, uuid, { nick, topN: newTopN })
  }

  return (
    <div>
      <button
        className={`vote-btn ${selected ? 'active' : ''}`}
        onClick={toggle}
        disabled={closed || (!selected && !canAdd)}
        title={
          closed ? 'Głosowanie zamknięte'
          : !selected && !canAdd ? `Możesz wybrać max ${topN}`
          : selected ? 'Kliknij żeby usunąć' : `Dodaj do top ${topN}`
        }
      >
        {selected ? '★' : '☆'} {selected ? 'Wybrano' : `Top ${topN}`}
      </button>
      {count > 0 && (
        <div style={{ marginTop: 6 }}>
          <ResultsBar
            value={count}
            max={maxCount}
            label={`${count} ${count === 1 ? 'wybór' : 'wyborów'}`}
            voters={voters[itemId] || []}
          />
        </div>
      )}
    </div>
  )
}
