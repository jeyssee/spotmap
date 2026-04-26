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
  food:    { label: 'Food',    color: '#ef4444' },
  drink:   { label: 'Drink',   color: '#a855f7' },
  culture: { label: 'Culture', color: '#3b82f6' },
  sport:   { label: 'Sport',   color: '#10b981' },
  nature:  { label: 'Nature',  color: '#22c55e' },
  other:   { label: 'Autre',   color: '#64748b' },
}

export const ArrowLeftIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
)
export const PinIcon = ({ size = 20, color = 'var(--accent)' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
)
const TargetIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
)
const LocateIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 11 22 2 13 21 11 13 3 11"/>
  </svg>
)
const CopyIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
)
const LayersIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/>
    <polyline points="2 17 12 22 22 17"/>
    <polyline points="2 12 12 17 22 12"/>
  </svg>
)

function createColoredIcon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
    <path d="M12 0C5.4 0 0 5.4 0 12c0 7.2 12 24 12 24s12-16.8 12-24C24 5.4 18.6 0 12 0z" fill="${color}" stroke="white" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/>
  </svg>`
  return L.divIcon({ html: svg, className: '', iconSize: [24, 36], iconAnchor: [12, 36], popupAnchor: [0, -36] })
}

function createClusterIcon(cluster) {
  return L.divIcon({
    html: `<div style="background:#FF8045;color:white;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.18);">${cluster.getChildCount()}</div>`,
    className: '', iconSize: [34, 34], iconAnchor: [17, 17],
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

const SIDEBAR_WIDTH = 292

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
    const channel = supabase.channel(`pins-${groupId}`)
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
      .from('pins').select('*, profiles(username), comments(id), reactions(id, type, user_id)')
      .eq('group_id', groupId).order('created_at', { ascending: false })
    setPins(data || [])
  }

  const showToast = (msg) => setToast(msg)
  const handleMapClick = (latlng) => { setClickedPos(latlng); setSelectedPin(null) }
  const handlePinClick = (pin) => {
    setSelectedPin(pin); setClickedPos(null)
    if (mapRef.current) mapRef.current.setView([pin.lat, pin.lng], 17, { animate: true })
  }
  const handlePinCreated = () => { setClickedPos(null); fetchPins(); showToast('Spot ajouté') }
  const handlePinDeleted = () => { setSelectedPin(null); fetchPins(); showToast('Spot supprimé') }
  const handlePinEdited = () => { fetchPins(); setSelectedPin(null); showToast('Spot modifié') }
  const handleSearchResult = (latlng) => {
    if (mapRef.current) mapRef.current.setView([latlng.lat, latlng.lng], 17, { animate: true })
  }
  const handleMemberFilter = (member) => {
    setActiveMember(member)
    if (member && mapRef.current) {
      const mp = pins.filter(p => p.user_id === member.id)
      if (mp.length > 0) mapRef.current.fitBounds(L.latLngBounds(mp.map(p => [p.lat, p.lng])), { padding: [40, 40], animate: true })
    } else if (!member && mapRef.current && pins.length > 0) {
      mapRef.current.fitBounds(L.latLngBounds(pins.map(p => [p.lat, p.lng])), { padding: [60, 60], animate: true })
    }
  }
  const centerOnAllSpots = () => {
    if (!mapRef.current || pins.length === 0) return
    const vp = activeMember ? pins.filter(p => p.user_id === activeMember.id) : pins
    if (vp.length === 0) return
    mapRef.current.fitBounds(L.latLngBounds(vp.map(p => [p.lat, p.lng])), { padding: [60, 60], animate: true })
  }
  const geolocate = () => {
    if (!navigator.geolocation) { showToast('Géolocalisation non supportée'); return }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { if (mapRef.current) mapRef.current.setView([coords.latitude, coords.longitude], 15, { animate: true }); showToast('Centré sur ta position') },
      () => showToast('Position non disponible')
    )
  }
  const copyInviteCode = () => {
    if (!group) return
    navigator.clipboard.writeText(group.invite_code).then(() => { setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000) })
  }

  const filteredPins = pins.filter(p => {
    if (activeCategory && p.category !== activeCategory) return false
    if (activeMember && p.user_id !== activeMember.id) return false
    return true
  })

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--text-tertiary)' }}>Chargement...</p>
    </div>
  )
  if (!group) return <div style={{ padding: '32px' }}><p>Groupe introuvable</p></div>

  const floatingBtn = {
    display: 'flex', alignItems: 'center', gap: '6px',
    backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
    border: '1px solid var(--border)', borderRadius: '100px',
    padding: '8px 14px', fontSize: '12px', fontWeight: '500',
    color: 'var(--text-secondary)', cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  }

  const pillStyle = {
    backgroundColor: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(12px)',
    borderRadius: '100px',
    border: '1px solid var(--border)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  }

  const spotsButtonRight = panelOpen ? SIDEBAR_WIDTH + 12 : 12

  return (
    <div style={{ height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      {/* Carte plein écran */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <MapContainer
          center={[48.8566, 2.3522]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <MapRefCapture mapRef={mapRef} />
          <MapClickHandler onMapClick={handleMapClick} />
          <MarkerClusterGroup iconCreateFunction={createClusterIcon} showCoverageOnHover={false} maxClusterRadius={50}>
            {filteredPins.map((pin) => (
              <Marker
                key={pin.id}
                position={[pin.lat, pin.lng]}
                icon={createColoredIcon(CATEGORIES[pin.category]?.color || '#64748b')}
                eventHandlers={{ click: () => handlePinClick(pin) }}
              >
                <Popup>
                  <strong style={{ fontSize: '13px' }}>{pin.title}</strong><br />
                  <span style={{ fontSize: '11px', color: '#666' }}>{CATEGORIES[pin.category]?.label} · par {pin.profiles?.username}</span>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
          {clickedPos && <Marker position={[clickedPos.lat, clickedPos.lng]} icon={createColoredIcon('#94a3b8')} />}
        </MapContainer>
      </div>

      {/* ── TOP : navbar ── */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, pointerEvents: 'none' }}>

        {/* Pill gauche : alignée à gauche */}
        <div style={{
          ...pillStyle,
          position: 'absolute', top: '12px', left: '12px',
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '8px 16px 8px 8px',
          pointerEvents: 'all', height: '54px',
        }}>
          <button
            onClick={() => navigate('/')}
            style={{
              width: '34px', height: '34px', borderRadius: '50%',
              backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            <ArrowLeftIcon size={15} />
          </button>
          {/* Tout sur une seule ligne */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap' }}>
              {group.name}
            </p>
            <span style={{ color: 'var(--border)', fontSize: '12px' }}>·</span>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
              {pins.length} spot{pins.length > 1 ? 's' : ''}
            </span>
            <span style={{ color: 'var(--border)', fontSize: '12px' }}>·</span>
            <button
              onClick={copyInviteCode}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                fontSize: '11px', color: codeCopied ? 'var(--accent)' : 'var(--text-tertiary)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0, whiteSpace: 'nowrap',
              }}
            >
              <CopyIcon size={11} />
              {codeCopied ? 'Copié !' : group.invite_code}
            </button>
          </div>
        </div>

        {/* Pill searchbar : centrée absolument par rapport à l'écran */}
        <div style={{
          ...pillStyle,
          position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', padding: '0 16px',
          pointerEvents: 'all', height: '54px',
        }}>
          <SearchBar onResult={handleSearchResult} />
        </div>
      </div>

      {/* ── BOUTON SPOTS flottant à droite, se décale quand sidebar ouverte ── */}
      <div style={{
        position: 'absolute',
        right: spotsButtonRight,
        top: '50%', transform: 'translateY(-50%)',
        zIndex: 1000,
        transition: 'right 0.3s ease',
      }}>
        <button
          onClick={() => setPanelOpen(!panelOpen)}
          style={{
            ...pillStyle,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            padding: '12px 10px', borderRadius: '16px',
            color: panelOpen ? 'var(--accent)' : 'var(--text-secondary)',
            border: '1px solid ' + (panelOpen ? 'var(--accent-border)' : 'var(--border)'),
            backgroundColor: panelOpen ? 'var(--accent-light)' : 'rgba(255,255,255,0.92)',
            cursor: 'pointer', transition: 'background 0.2s, color 0.2s, border 0.2s',
          }}
        >
          <LayersIcon size={18} />
          <span style={{ fontSize: '10px', fontWeight: '600' }}>Spots</span>
        </button>
      </div>

      {/* ── BAS GAUCHE : géoloc + centrer côte à côte ── */}
      <div style={{ position: 'absolute', bottom: '24px', left: '16px', display: 'flex', gap: '8px', zIndex: 1000 }}>
        <button onClick={geolocate} style={floatingBtn}>
          <LocateIcon size={14} />
          Ma position
        </button>
        {pins.length > 0 && (
          <button onClick={centerOnAllSpots} style={floatingBtn}>
            <TargetIcon size={14} />
            Centrer
          </button>
        )}
      </div>

      {/* ── SIDEBAR flottante ── */}
      {panelOpen && session && (
        <div style={{ position: 'absolute', top: '72px', right: '12px', bottom: '16px', zIndex: 1000 }}>
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
            onClose={() => setPanelOpen(false)}
          />
        </div>
      )}

      {/* PinForm centré en bas */}
      {clickedPos && (
        <div style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, width: '360px', maxWidth: 'calc(100vw - 32px)' }}>
          <PinForm
            position={clickedPos}
            groupId={groupId}
            userId={session?.user?.id}
            categories={CATEGORIES}
            onClose={() => setClickedPos(null)}
            onCreated={handlePinCreated}
            mapRef={mapRef}
          />
        </div>
      )}

      {/* PinDetail bas droite */}
      {selectedPin && (
        <div style={{
          position: 'absolute', bottom: '16px',
          right: panelOpen ? SIDEBAR_WIDTH + 20 : 70,
          zIndex: 1000, width: '320px', maxWidth: 'calc(100vw - 32px)',
          transition: 'right 0.3s ease',
        }}>
          <PinDetail
            pin={selectedPin}
            session={session}
            categories={CATEGORIES}
            onClose={() => setSelectedPin(null)}
            onDeleted={handlePinDeleted}
            onReactionUpdate={fetchPins}
            onEdited={handlePinEdited}
          />
        </div>
      )}
    </div>
  )
}