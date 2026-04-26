import { useState, useRef, useEffect } from 'react'

const SearchIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const XIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

export default function SearchBar({ onResult }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (query.length < 3) { setSuggestions([]); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`,
          { headers: { 'Accept-Language': 'fr' } }
        )
        setSuggestions(await res.json())
      } catch { setSuggestions([]) }
      setLoading(false)
    }, 400)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  const handleSelect = (item) => {
    onResult({ lat: parseFloat(item.lat), lng: parseFloat(item.lon) })
    setQuery(item.display_name.split(',').slice(0, 2).join(','))
    setSuggestions([])
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Input en fit-content */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '0',
      }}>
        <span style={{ color: 'var(--text-tertiary)', display: 'flex', flexShrink: 0 }}>
          <SearchIcon size={14} />
        </span>
        <input
          type="text"
          placeholder="Rechercher une adresse..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            border: 'none', background: 'none', outline: 'none',
            fontSize: '13px', color: 'var(--text-primary)',
            width: '220px',
          }}
        />
        {loading && <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', flexShrink: 0 }}>...</span>}
        {query && (
          <button
            onClick={() => { setQuery(''); setSuggestions([]) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', padding: 0, flexShrink: 0 }}
          >
            <XIcon size={13} />
          </button>
        )}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <ul style={{
          position: 'absolute', top: 'calc(100% + 12px)', left: '50%', transform: 'translateX(-50%)',
          width: '300px',
          backgroundColor: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(12px)',
          border: '1px solid var(--border)', borderRadius: '14px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          zIndex: 2000, maxHeight: '220px', overflowY: 'auto',
          listStyle: 'none', margin: 0, padding: '6px',
        }}>
          {suggestions.map((item) => (
            <li
              key={item.place_id}
              onClick={() => handleSelect(item)}
              style={{ padding: '8px 10px', borderRadius: '10px', cursor: 'pointer', transition: 'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-input)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                {item.display_name.split(',')[0]}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>
                {item.display_name.split(',').slice(1, 3).join(',')}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}