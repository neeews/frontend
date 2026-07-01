import '../styles/categoryNav.css'

const CATEGORIES = ['전체', '정치', '경제', '사회', '연예/문화', '스포츠', '세계', 'IT/과학']

export default function CategoryNav({ activeCategory, onSelect }) {
  return (
    <nav className="category-nav">
      {CATEGORIES.map(cat => (
        <button
          key={cat}
          className={`cat-btn${activeCategory === cat ? ' active' : ''}`}
          onClick={() => onSelect(cat)}
        >
          {cat}
        </button>
      ))}
    </nav>
  )
}
