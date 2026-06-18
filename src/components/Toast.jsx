import { useState, useEffect } from 'react'

let toastCallback = null
export function showToast(msg, duration = 2500) {
  toastCallback?.(msg, duration)
}

export function ToastProvider() {
  const [toast, setToast] = useState(null)

  useEffect(() => {
    toastCallback = (msg, duration) => {
      setToast(msg)
      setTimeout(() => setToast(null), duration)
    }
    return () => { toastCallback = null }
  }, [])

  if (!toast) return null
  return <div className="toast">{toast}</div>
}
