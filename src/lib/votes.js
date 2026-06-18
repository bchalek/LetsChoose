// Compute aggregated results from all votes for a given mode

export function computeLikesResults(votes) {
  const counts = {}
  const voters = {}
  for (const v of votes) {
    for (const itemId of (v.likes || [])) {
      counts[itemId] = (counts[itemId] || 0) + 1
      voters[itemId] = voters[itemId] || []
      voters[itemId].push(v.nick)
    }
  }
  return { counts, voters }
}

export function computeTopNResults(votes) {
  const counts = {}
  const voters = {}
  for (const v of votes) {
    for (const itemId of (v.topN || [])) {
      counts[itemId] = (counts[itemId] || 0) + 1
      voters[itemId] = voters[itemId] || []
      voters[itemId].push(v.nick)
    }
  }
  return { counts, voters }
}

// ranking: each vote has { ranking: { itemId: position (1=best) } }
// score = sum of (totalItems - position + 1) across voters
export function computeRankingResults(votes, items) {
  const scores = {}
  const voterDetails = {}
  const total = items.length

  for (const v of votes) {
    const ranking = v.ranking || {}
    for (const itemId of Object.keys(ranking)) {
      const pos = ranking[itemId]
      const score = total - pos + 1
      scores[itemId] = (scores[itemId] || 0) + score
      voterDetails[itemId] = voterDetails[itemId] || []
      voterDetails[itemId].push({ nick: v.nick, position: pos })
    }
  }
  return { scores, voterDetails }
}
