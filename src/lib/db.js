import {
  collection, doc, addDoc, setDoc, getDoc, updateDoc, deleteDoc,
  getDocs, onSnapshot, query, orderBy, serverTimestamp, where
} from 'firebase/firestore'
import { db } from '../firebase'

// --- Lists ---

export async function createList(data) {
  const ref = doc(collection(db, 'lists'))
  await setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    closed: false,
  })
  return ref.id
}

export async function getList(listId) {
  const snap = await getDoc(doc(db, 'lists', listId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export function subscribeList(listId, callback) {
  return onSnapshot(doc(db, 'lists', listId), snap => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() })
    else callback(null)
  })
}

export async function updateList(listId, data) {
  await updateDoc(doc(db, 'lists', listId), data)
}

// --- Items ---

export function subscribeItems(listId, callback) {
  const q = query(
    collection(db, 'lists', listId, 'items'),
    orderBy('createdAt', 'asc')
  )
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export async function addItem(listId, data) {
  return addDoc(collection(db, 'lists', listId, 'items'), {
    ...data,
    createdAt: serverTimestamp(),
  })
}

export async function updateItem(listId, itemId, data) {
  await updateDoc(doc(db, 'lists', listId, 'items', itemId), data)
}

export async function deleteItem(listId, itemId) {
  await deleteDoc(doc(db, 'lists', listId, 'items', itemId))
}

// --- Votes ---

export function subscribeVotes(listId, callback) {
  return onSnapshot(collection(db, 'lists', listId, 'votes'), snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export async function setVote(listId, uuid, data) {
  await setDoc(doc(db, 'lists', listId, 'votes', uuid), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function clearVotes(listId) {
  const snap = await getDocs(collection(db, 'lists', listId, 'votes'))
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref)))
}

export async function deleteList(listId) {
  const subcollections = ['items', 'votes', 'comments']
  for (const sub of subcollections) {
    const snap = await getDocs(collection(db, 'lists', listId, sub))
    await Promise.all(snap.docs.map(d => deleteDoc(d.ref)))
  }
  await deleteDoc(doc(db, 'lists', listId))
}

// --- Comments ---

export function subscribeComments(listId, callback) {
  const q = query(
    collection(db, 'lists', listId, 'comments'),
    orderBy('createdAt', 'asc')
  )
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export async function addComment(listId, data) {
  return addDoc(collection(db, 'lists', listId, 'comments'), {
    ...data,
    createdAt: serverTimestamp(),
  })
}

export async function deleteComment(listId, commentId) {
  await deleteDoc(doc(db, 'lists', listId, 'comments', commentId))
}
