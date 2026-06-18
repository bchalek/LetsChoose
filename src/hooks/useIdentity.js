import { useState, useEffect } from 'react'
import { generateId } from '../lib/crypto'

function getOrCreateUuid() {
  let uuid = localStorage.getItem('lc_uuid')
  if (!uuid) {
    uuid = generateId()
    localStorage.setItem('lc_uuid', uuid)
  }
  return uuid
}

export function useIdentity(listId) {
  const [uuid] = useState(getOrCreateUuid)
  const [nick, setNickState] = useState(() =>
    listId ? localStorage.getItem(`lc_nick_${listId}`) || '' : ''
  )

  useEffect(() => {
    if (listId) {
      const saved = localStorage.getItem(`lc_nick_${listId}`) || ''
      setNickState(saved)
    }
  }, [listId])

  function setNick(value) {
    localStorage.setItem(`lc_nick_${listId}`, value)
    setNickState(value)
  }

  return { uuid, nick, setNick }
}
