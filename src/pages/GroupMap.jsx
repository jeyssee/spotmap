import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import { supabase } from '../lib/supabase'
import PinForm from '../components/PinForm'
import PinDetail from '../components/PinDetail'
import SearchBar from '../components/SearchBar'
import SidePanel from '../components/SidePanel'
import Toast from '../components/Toast'

export const CATEGORIES = {
  food: { label: '🍽️ Food', color: '#ef4444' },
  drink: { label: '🍷 Drink', color: '#a855f7' },
  culture: { label: '🎨 Culture', color: '#3b82f6' },
  sport: { label: '🏃 Sport', color: '#10b981' },
  nature: { label: '🌳 Nature', color: '#22c55e' },
  other: { label: '📍 Autre', color: '#64748b' },
}

function createColoredIcon(color) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 7.2 12 24 12 24s12-16.8 12-24C24 5.4 18.6 0 12 0z"
        fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/>
    </svg>
  `
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
  })
}

function createClusterIcon(cluster) {
  const count = cluster.getChildCount()
  return L.divIcon({
    html: `<div style="
      background: #3b82f6;
      color: white;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    ">${count}</div>`,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  })
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) })
  return null
}

function MapRefCapture({ mapRef }) {
  const map = useMap()
  useEffect(() => { mapRef.current = map }, [map])
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
  const [activeMember, setActiveMember] = useState(null)
  const [toast, setToast] = useState(null)
  const [codeCopied, setCodeCopied] = useState(false)

  useEffect(() => {
    fetchData()
    const channel = supabase
      .channel(`pins-${groupId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pins', filter: `group_id=eq.${groupId}` }, () => fetchPins())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [groupId])

  const fetchData = async () => {
    setLoading(true)
    const { data: groupData } = await supabase.from('groups').select('*').eq('id', groupId).single()
    setGroup(groupData)
    await fetchPins()
    setLoading(false)
  }

  const fetchPins = async () => {
    const { data } = await supabase
      .from('pins')
      .select('*, profiles(username), comments(id), reactions(id, type, user_id)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
    setPins(data || [])
  }

  const showToast = (message) => setToast(message)

  const handleMapClick = (latlng) => { setClickedPos(latlng); setSelectedPin(null) }

  const handlePinClick = (pin) => {
    setSelectedPin(pin)
    setClickedPos(null)
    if (mapRef.current) mapRef.current.setView([pin.lat, pin.lng], 17, { animate: true })
  }

  const handlePinCreated = () => { setClickedPos(null); fetchPins(); showToast('✅ Spot ajouté !') }
  const handlePinDeleted = () => { setSelectedPin(null); fetchPins(); showToast('🗑️ Spot supprimé') }
  const handlePinEdited = () => { fetchPins(); setSelectedPin(null); showToast('✏️ Spot modifié !') }
  const handleSearchResult = (latlng) => {
    if (mapRef.current) mapRef.current.setView([latlng.lat, latlng.lng], 17, { animate: true })
  }

  const handleMemberFilter = (member) => {
    setActiveMember(member)
    if (member && mapRef.current) {
      const memberPins = pins.filter(p => p.user_id === member.id)
      if (memberPins.length > 0) {
        const bounds = L.latLngBounds(memberPins.map(p => [p.lat, p.lng]))
        mapRef.current.fitBounds(bounds, { padding: [40, 40], animate: true })
      }
    } else if (!member && mapRef.current && pins.length > 0) {
      const bounds = L.latLngBounds(pins.map(p => [p.lat, p.lng]))
      mapRef.current.fitBounds(bounds, { padding: [60, 60], animate: true })
    }
  }

  const centerOnAllSpots = () => {
    if (!mapRef.current || pins.length === 0) return
    const visiblePins = activeMember ? pins.filter(p => p.user_id === activeMember.id) : pins
    if (visiblePins.length === 0) return
    const bounds = L.latLngBounds(visiblePins.map(p => [p.lat, p.lng]))
    mapRef.current.fitBounds(bounds, { padding: [60, 60], animate: true })
  }

  const geolocate = () => {
    if (!navigator.geolocation) { showToast('❌ Géolocalisation non supportée'); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        if (mapRef.current) mapRef.current.setView([latitude, longitude], 15, { animate: true })
        showToast('📍 Centré sur ta position')
      },
      () => showToast('❌ Position non disponible')
    )
  }

  const copyInviteCode = () => {
    if (!group) return
    navigator.clipboard.writeText(group.invite_code).then(() => {
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    })
  }

  const filteredPins = pins.filter(p => {
    if (activeCategory && p.category !== activeCategory) return false
    if (activeMember && p.user_id !== activeMember.id) return false
    return true
  })

  if (loading) return (
    <div style={{ height: '100vh' }} className="flex items-center justify-center">
      <p>Chargement...</p>
    </div>
  )

  if (!group) return <div className="p-8"><p>Groupe introuvable</p></div>

  return (
    <div style={{ height: '100vh' }} className="flex flex-col">

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3 flex items-center gap-4 z-10 flex-shrink-0">
        <button onClick={() => navigate('/')} className="text-sm text-slate-500 hover:text-slate-700">
          ← Retour
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-slate-900 leading-tight">{group.name}</h1>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            Code :
            <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{group.invite_code}</span>
            <button
              onClick={copyInviteCode}
              className="text-slate-400 hover:text-blue-500 transition"
              title="Copier le code"
            >
              {codeCopied ? '✅' : '📋'}
            </button>
            <span className="ml-1">· {pins.length} spot{pins.length > 1 ? 's' : ''}</span>
          </p>
        </div>
        <div className="w-72 hidden md:block">
          <SearchBar onResult={handleSearchResult} />
        </div>
      </div>

      {/* Search mobile */}
      <div className="md:hidden px-4 py-2 bg-white border-b">
        <SearchBar onResult={handleSearchResult} />
      </div>

      {/* Contenu */}
      <div className="flex flex-1 overflow-hidden">

        {/* Carte */}
        <div className="relative flex-1">
          <MapContainer center={[48.8566, 2.3522]} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <MapRefCapture mapRef={mapRef} />
            <MapClickHandler onMapClick={handleMapClick} />

            <MarkerClusterGroup
              iconCreateFunction={createClusterIcon}
              showCoverageOnHover={false}
              maxClusterRadius={50}
            >
              {filteredPins.map((pin) => (
                <Marker
                  key={pin.id}
                  position={[pin.lat, pin.lng]}
                  icon={createColoredIcon(CATEGORIES[pin.category]?.color || '#64748b')}
                  eventHandlers={{ click: () => handlePinClick(pin) }}
                >
                  <Popup>
                    <strong>{pin.title}</strong><br />
                    <span className="text-xs">{CATEGORIES[pin.category]?.label}</span><br />
                    <span className="text-xs text-slate-500">par {pin.profiles?.username}</span>
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>

            {clickedPos && (
              <Marker
                position={[clickedPos.lat, clickedPos.lng]}
                icon={createColoredIcon('#94a3b8')}
              />
            )}
          </MapContainer>

          {/* Boutons flottants */}
          <div className="absolute bottom-6 left-4 flex flex-col gap-2 z-[1000]">
            {/* Géolocalisation */}
            <button
              onClick={geolocate}
              className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 shadow transition"
              title="Ma position"
            >
              📍 Ma position
            </button>
            {/* Centrer sur les spots */}
            {pins.length > 0 && (
              <button
                onClick={centerOnAllSpots}
                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 shadow transition"
                title="Centrer sur les spots"
              >
                🎯 Centrer
              </button>
            )}
          </div>

          {clickedPos && (
            <PinForm
              position={clickedPos}
              groupId={groupId}
              userId={session?.user?.id}
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
              onReactionUpdate={fetchPins}
              onEdited={handlePinEdited}
            />
          )}

          {/* Bouton toggle sidebar */}
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            className="absolute top-1/2 right-0 -translate-y-1/2 bg-white border border-slate-200 border-r-0 rounded-l-lg px-1.5 py-4 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition z-[1000] shadow-sm"
          >
            {panelOpen ? '▶' : '◀'}
          </button>
        </div>

        {/* Sidebar */}
        {panelOpen && session && (
          <SidePanel
            pins={pins}
            categories={CATEGORIES}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            onPinClick={handlePinClick}
            filteredPins={filteredPins}
            session={session}
            groupId={groupId}
            activeMember={activeMember}
            onMemberFilter={handleMemberFilter}
          />
        )}

      </div>
    </div>
  )
}