const STORAGE_KEY = 'readArticleIds'
const MAX_STORED = 500

export function getReadArticleIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [])
  } catch {
    return new Set()
  }
}

export function markArticleRead(id) {
  const ids = getReadArticleIds()
  if (ids.has(id)) return ids
  ids.add(id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids].slice(-MAX_STORED)))
  return ids
}
