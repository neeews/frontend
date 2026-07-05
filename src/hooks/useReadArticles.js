import { useState, useCallback } from 'react'
import { getReadArticleIds, markArticleRead } from '../utils/readArticles'

export function useReadArticles() {
  const [readIds, setReadIds] = useState(getReadArticleIds)

  const isRead = useCallback(id => readIds.has(id), [readIds])

  const markRead = useCallback(id => {
    setReadIds(markArticleRead(id))
  }, [])

  return { isRead, markRead }
}
