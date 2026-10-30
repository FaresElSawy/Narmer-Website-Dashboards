export function createPrivateState(storage, store, now = Date.now) {
  if (!['b2b', 'b2c'].includes(store)) throw new TypeError('Invalid store')
  const prefix = `narmer:${store}:`
  return {
    save(key, value, expiresAt) {
      if (!Number.isFinite(expiresAt) || expiresAt <= now())
        throw new RangeError('A future server deadline is required')
      const serialized = JSON.stringify({ value, expiresAt }, (name, item) => {
        if (
          item instanceof Blob ||
          item instanceof ArrayBuffer ||
          ArrayBuffer.isView(item) ||
          (typeof item === 'string' && /^(blob:|data:)/i.test(item))
        )
          throw new TypeError('Do not persist files, binary values or temporary image URLs')
        return item
      })
      storage.setItem(prefix + key, serialized)
    },
    load(key) {
      try {
        const entry = JSON.parse(storage.getItem(prefix + key))
        if (!entry || !Number.isFinite(entry.expiresAt) || entry.expiresAt <= now()) {
          storage.removeItem(prefix + key)
          return null
        }
        return entry.value
      } catch {
        storage.removeItem(prefix + key)
        return null
      }
    },
    forget(key) {
      storage.removeItem(prefix + key)
    },
    clear() {
      for (let i = storage.length - 1; i >= 0; i--) {
        const key = storage.key(i)
        if (key?.startsWith(prefix)) storage.removeItem(key)
      }
    },
  }
}

export function consumeTrackingFragment(location, history) {
  if (!location.hash) return null
  const token = new URLSearchParams(location.hash.slice(1)).get('token')
  history.replaceState(history.state, '', location.pathname + location.search)
  return token || null
}
