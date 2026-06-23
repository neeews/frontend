import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import MainPage from './pages/MainPage'
import ArticleDetailPage from './pages/ArticleDetailPage'
import CategoryPage from './pages/CategoryPage'
import SearchPage from './pages/SearchPage'
import MyPage from './pages/MyPage'
import { tokenStorage } from './api/auth'

function ProtectedRoute({ children }) {
  return tokenStorage.getAccess() ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/articles/:id" element={<ArticleDetailPage />} />
        <Route path="/category/:name" element={<CategoryPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/mypage" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
