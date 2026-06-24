import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { articlesApi } from '../api/articles'
import { useAuth } from '../context/AuthContext'

export function useBookmark(articleId, initialState = false) {
  const [isBookmarked, setIsBookmarked] = useState(initialState)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()

  useEffect(() => {
    setIsBookmarked(initialState)
  }, [initialState])

  const toggle = async () => {
    if (!isLoggedIn) {
      navigate('/login')
      return
    }
    setLoading(true)
    try {
      if (isBookmarked) {
        await articlesApi.removeBookmark(articleId)
      } else {
        await articlesApi.addBookmark(articleId)
      }
      setIsBookmarked(b => !b)
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }

  return { isBookmarked, toggle, loading }
}
