import { setVote } from '../lib/db'
import { computeLikesResults } from '../lib/votes'
import ResultsBar from './ResultsBar'

export default function VotingLikes({ listId, itemId, votes, uuid, nick, closed }) {
  const myVote = votes.find(v => v.id === uuid)
  const myLikes = myVote?.likes || []
  const liked = myLikes.includes(itemId)

  const { counts, voters } = computeLikesResults(votes)
  const maxCount = Math.max(1, ...Object.values(counts))
  const count = counts[itemId] || 0

  async function toggle() {
    if (closed) return
    const newLikes = liked
      ? myLikes.filter(id => id !== itemId)
      : [...myLikes, itemId]
    await setVote(listId, uuid, { nick, likes: newLikes })
  }

  return (
    <div>
      <button
        className={`vote-btn ${liked ? 'liked' : ''}`}
        onClick={toggle}
        disabled={closed}
        title={closed ? 'Głosowanie zamknięte' : ''}
      >
        {liked ? '♥' : '♡'} {count > 0 ? count : ''}
      </button>
      {count > 0 && (
        <div style={{ marginTop: 6 }}>
          <ResultsBar
            value={count}
            max={maxCount}
            label={`${count} ${count === 1 ? 'głos' : count < 5 ? 'głosy' : 'głosów'}`}
            voters={voters[itemId] || []}
          />
        </div>
      )}
    </div>
  )
}
