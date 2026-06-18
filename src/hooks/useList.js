import { useState, useEffect } from 'react'
import { subscribeList, subscribeItems, subscribeVotes, subscribeComments } from '../lib/db'

export function useList(listId) {
  const [list, setList] = useState(undefined)
  useEffect(() => {
    if (!listId) return
    return subscribeList(listId, setList)
  }, [listId])
  return list
}

export function useItems(listId) {
  const [items, setItems] = useState([])
  useEffect(() => {
    if (!listId) return
    return subscribeItems(listId, setItems)
  }, [listId])
  return items
}

export function useVotes(listId) {
  const [votes, setVotes] = useState([])
  useEffect(() => {
    if (!listId) return
    return subscribeVotes(listId, setVotes)
  }, [listId])
  return votes
}

export function useComments(listId) {
  const [comments, setComments] = useState([])
  useEffect(() => {
    if (!listId) return
    return subscribeComments(listId, setComments)
  }, [listId])
  return comments
}
