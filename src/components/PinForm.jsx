import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function PinForm({ position, groupId, userId, categories, onClose, onCreated, mapRef }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('food')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Recherche d'adresse
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState(null)

  const searchAddress = async (query) => {
    if (query.length < 3) {
      setSearchResults([])
      return
    }
    setSearchLoading(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`,
        { headers: { 'Accept-Language': 'fr' } }
      )
      const data = await res.json()
      setSearchResults(data)
    } catch (e) {
      console.error(e)
    }
    setSearchLoading(false)
  }

  const handleSearchInput = (e) => {
    const val = e.target.value
    setSearchQuery(val)
    setSelectedAddress(null)
    searchAddress(val)
  }

  const selectAddress = (result) => {
    setSelectedAddress(result)
    setSearchQuery(result.display_name)
    setSearchResults([])
    // Déplace la carte vers l'adresse trouvée
    if (mapRef?.current) {
      mapRef.current.setView([parseFloat(result.lat), parseFloat(result.lon)], 16)
    }
    // Pré-remplit le titre si vide
    if (!title) {
      const name = result.name || result.address?.road || result.display_name.split(',')[0]
      setTitle(name)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Utilise la position de l'adresse recherchée ou du clic sur la carte
    const lat = selectedAddress ? parseFloat(selectedAddress.lat) : position.lat
    const lng = selectedAddress ? parseFloat(selectedAddress.lon) : position.lng

    const { error } = await supabase.from('pins').insert({
      group_id: groupId,
      user_id: userId,
      title,
      description,
      category,
      lat,
      lng,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      onCreated()
    }
  }

  return (
    <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-xl shadow-xl p-6 z-[1000]">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-bold text-lg text-slate-900">Nouveau spot 📍</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">

        {/* Recherche d'adresse */}
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 Rechercher une adresse..."
            value={searchQuery}
            onChange={handleSearchInput}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchLoading && (
            <p className="text-xs text-slate-400 mt-1">Recherche...</p>
          )}
          {searchResults.length > 0 && (
            <ul className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg mt-1 z-10 max-h-48 overflow-y-auto">
              {searchResults.map((result) => (
                <li
                  key={result.place_id}
                  onClick={() => selectAddress(result)}
                  className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                >
                  {result.display_name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {selectedAddress && (
          <p className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
            ✅ Position mise à jour sur la carte
          </p>
        )}

        <input
          type="text"
          placeholder="Nom du spot"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <textarea
          placeholder="Ton avis, un conseil... (optionnel)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />

        <div className="grid grid-cols-3 gap-2">
          {Object.entries(categories).map(([key, { label }]) => (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key)}
              className={`px-3 py-2 text-sm rounded-lg border transition ${
                category === key
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {loading ? 'Enregistrement...' : 'Épingler ce spot'}
        </button>
      </form>
    </div>
  )
}