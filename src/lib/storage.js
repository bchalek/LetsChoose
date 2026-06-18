import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../firebase'
import { generateId } from './crypto'

export async function uploadImage(listId, file) {
  const ext = file.name.split('.').pop()
  const path = `lists/${listId}/${generateId()}.${ext}`
  const storageRef = ref(storage, path)
  const snap = await uploadBytes(storageRef, file)
  return getDownloadURL(snap.ref)
}
