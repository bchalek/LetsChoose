const PBKDF2_ITERATIONS = 200_000

function toHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}
function fromHex(hex) {
  return new Uint8Array(hex.match(/.{2}/g).map(b => parseInt(b, 16)))
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial, 256
  )
  return { salt: toHex(salt), hash: toHex(new Uint8Array(bits)), iterations: PBKDF2_ITERATIONS }
}

export async function verifyPassword(password, { salt, hash, iterations }) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: fromHex(salt), iterations: iterations ?? PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial, 256
  )
  return toHex(new Uint8Array(bits)) === hash
}

export function generateId() {
  return crypto.randomUUID()
}

export function generateAdminToken() {
  return crypto.randomUUID() + '-' + crypto.randomUUID()
}
