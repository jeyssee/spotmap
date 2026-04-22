import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { supabase } from '../lib/supabase'
import PinForm from '../components/PinForm'
import PinDetail from '../components/PinDetail'
import SearchBar from '../components/SearchBar'
import SidePanel from '../components/SidePanel'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export const CATEGORIES = {
  food: { label: '🍽️ Food', color: '#ef4444' },
  drink: { label: '🍷 Drink', color: '#a855f7' },
  culture: { label: '🎨 Culture', color: '#3b82f6' },
  sport: { label: '🏃 Sport', color: '#10b981' },
  nature: { label: '🌳 Nature', color: '#22c55e' },
  other: { label: '📍 Autre', color: '#64748b' },
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => onMapClick(e.latlng),
  })
  return null
}

function MapRefCapture({ mapRef }) {
  const map = useMap()
  useEffect(() => {
    mapRef.current = map
  }, [map])
  return null
}

export default function GroupMap({ session }) {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const mapRef = useRef(null)
  const [group, setGroup] = useState(null)
  const [pins, setPins] = useState([])
  const [clickedPos, setClickedPos] = useState(null)
  const [selectedPin, setSelectedPin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [panelOpen, setPanelOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState(null)

  useEffect(() => {
    fetchData()

    const channel = supabase
      .channel(`pins-${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pins', filter: `group_id=eq.${groupId}` },
        () => fetchPins()
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [groupId])

  const fetchData = async () => {
    setLoading(true)
    const { data: groupData } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single()
    setGroup(groupData)
    await fetchPins()
    setLoading(false)
  }

  const fetchPins = async () => {
    const { data } = await supabase
      .from('pins')
      .select('*, profiles(username)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
    setPins(data || [])
  }

  const handleMapClick = (latlng) => {
    setClickedPos(latlng)
    setSelectedPin(null)
  }

  const handlePinClick = (pin) => {
    setSelectedPin(pin)
    setClickedPos(null)
    if (mapRef.current) {
      mapRef.current.setView([pin.lat, pin.lng], 17, { animate: true })
    }
  }

  const handlePinCreated = () => {
    setClickedPos(null)
    fetchPins()
  }

  const handlePinDeleted = () => {
    setSelectedPin(null)
    fetchPins()
  }

  const handleSearchResult = (latlng) => {
    if (mapRef.current) {
      mapRef.current.setView([latlng.lat, latlng.lng], 17, { animate: true })
    }
  }

  const filteredPins = activeCategory
    ? pins.filter(p => p.category === activeCategory)
    : pins

  if (loading) {
    return <div style={{ height: '100vh' }} className="flex items-center justify-center"><p>Chargement...</p></div>
  }

  if (!group) {
    return <div className="p-8"><p>Groupe introuvable</p></div>
  }

  return (
    <div style={{ height: '100vh' }} className="flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3 flex items-center gap-4 z-10 flex-shrink-0">
        <button onClick={() => navigate('/')} className="text-sm text-slate-500 hover:text-slate-700">
          ← Retour
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-slate-900 leading-tight">{group.name}</h1>
          <p className="text-xs text-slate-500">
            Code : <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{group.invite_code}</span>
            {' · '}{pins.length} spot{pins.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="w-72 hidden md:block">
          <SearchBar onResult={handleSearchResult} />
        </div>
      </div>

      {/* Barre de recherche mobile */}
      <div className="md:hidden px-4 py-2 bg-white border-b">
        <SearchBar onResult={handleSearchResult} />
      </div>

      {/* Contenu principal */}
     <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Carte — prend tout l'espace disponible */}
        <div className="relative flex-1">
          <MapContainer
            center={[48.8566, 2.3522]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
/>
            <MapRefCapture mapRef={mapRef} />
            <MapClickHandler onMapClick={handleMapClick} />

            {filteredPins.map((pin) => (
              <Marker
                key={pin.id}
                position={[pin.lat, pin.lng]}
                eventHandlers={{
                  click: () => handlePinClick(pin),
                }}
              >
                <Popup>
                  <strong>{pin.title}</strong><br />
                  <span className="text-xs">{CATEGORIES[pin.category]?.label}</span><br />
                  <span className="text-xs text-slate-500">par {pin.profiles?.username}</span>
                </Popup>
              </Marker>
            ))}

            {clickedPos && (
              <Marker position={[clickedPos.lat, clickedPos.lng]} />
            )}
          </MapContainer>

          {clickedPos && (
            <PinForm
              position={clickedPos}
              groupId={groupId}
              userId={session.user.id}
              categories={CATEGORIES}
              onClose={() => setClickedPos(null)}
              onCreated={handlePinCreated}
              mapRef={mapRef}
            />
          )}

          {selectedPin && (
            <PinDetail
              pin={selectedPin}
              session={session}
              categories={CATEGORIES}
              onClose={() => setSelectedPin(null)}
              onDeleted={handlePinDeleted}
            />
          )}

          {/* Bouton toggle collé au bord droit de la carte */}
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            className="absolute top-1/2 right-0 -translate-y-1/2 bg-white border border-slate-200 border-r-0 rounded-l-lg px-1.5 py-4 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition z-[1000] shadow-sm"
            title={panelOpen ? 'Masquer' : 'Afficher les spots'}
          >
            {panelOpen ? '▶' : '◀'}
          </button>
        </div>

        {/* Sidebar — montée/cachée proprement, sans laisser d'espace */}
        {panelOpen && (
          <SidePanel
            pins={pins}
            categories={CATEGORIES}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            onPinClick={handlePinClick}
            filteredPins={filteredPins}
            session={session}
          />
        )}
      </div>
    </div>
  )
}