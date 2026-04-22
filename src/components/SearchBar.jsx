import { useState, useRef, useEffect } from 'react'

export default function SearchBar({ onResult }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([])
      return
    }

    // Debounce : attend 400ms après la dernière frappe avant de chercher
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`,
          { headers: { 'Accept-Language': 'fr' } }
        )
        const data = await res.json()
        setSuggestions(data)
      } catch {
        setSuggestions([])
      }
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
    <div className="relative">
      <div className="flex items-center bg-white border border-slate-300 rounded-lg px-3 py-2 gap-2">
        <span className="text-slate-400">🔍</span>
        <input
          type="text"
          placeholder="Rechercher une adresse..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 text-sm outline-none bg-transparent"
        />
        {loading && <span className="text-slate-400 text-xs">...</span>}
        {query && (
          <button
            onClick={() => { setQuery(''); setSuggestions([]) }}
            className="text-slate-400 hover:text-slate-600 text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {suggestions.length > 0 && (
        <ul className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-[2000] max-h-60 overflow-y-auto">
          {suggestions.map((item) => (
            <li
              key={item.place_id}
              onClick={() => handleSelect(item)}
              className="px-4 py-2.5 text-sm hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
            >
              <span className="font-medium text-slate-800">
                {item.display_name.split(',')[0]}
              </span>
              <span className="text-slate-400 text-xs ml-1">
                {item.display_name.split(',').slice(1, 3).join(',')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
