import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function timeAgo(dateStr) {
  if (!dateStr) return null
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now - date) / 1000)
  if (isNaN(diff)) return null
  if (diff < 60) return "à l'instant"
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`
  return `il y a ${Math.floor(diff / 86400)}j`
}

const ClockIcon = ({ size = 11 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const MessageIcon = ({ size = 11 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)
const ZapIcon = ({ size = 11 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)
const XIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

export default function SidePanel({ pins, categories, activeCategory, onCategoryChange, onPinClick, filteredPins, session, groupId, activeMember, onMemberFilter, onClose }) {
  const [activeTab, setActiveTab] = useState('spots')
  const [members, setMembers] = useState([])
  const [sortOrder, setSortOrder] = useState('desc')
  const userId = session?.user?.id

  useEffect(() => {
    if (activeTab === 'members') fetchMembers()
  }, [activeTab])

  const fetchMembers = async () => {
    const { data } = await supabase
      .from('group_members')
      .select('*, profiles(username)')
      .eq('group_id', groupId)
    setMembers(data || [])
  }

  const sortedPins = [...filteredPins].sort((a, b) => {
    const da = new Date(a.created_at), db = new Date(b.created_at)
    return sortOrder === 'desc' ? db - da : da - db
  })

  const tabStyle = (active) => ({
    flex: 1, padding: '10px', border: 'none', background: 'none',
    fontSize: '13px', fontWeight: active ? '600' : '400',
    color: active ? 'var(--text-primary)' : 'var(--text-tertiary)',
    cursor: 'pointer',
    borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
    transition: 'all 0.15s',
  })

  return (
    <div style={{
      width: '280px',
      height: '100%',
      backgroundColor: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(16px)',
      borderRadius: '20px',
      border: '1px solid var(--border)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>

      {/* Header avec onglets et fermeture */}
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingRight: '8px' }}>
        <button style={tabStyle(activeTab === 'spots')} onClick={() => setActiveTab('spots')}>Spots</button>
        <button style={tabStyle(activeTab === 'members')} onClick={() => setActiveTab('members')}>Membres</button>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', padding: '4px', flexShrink: 0 }}
        >
          <XIcon size={14} />
        </button>
      </div>

      {activeTab === 'spots' && (
        <>
          {/* Filtres */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
            {activeMember && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--accent-light)', borderRadius: '8px', padding: '5px 10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: '500' }}>{activeMember.username}</span>
                <button onClick={() => onMemberFilter(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', display: 'flex', padding: 0 }}>
                  <XIcon size={12} />
                </button>
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '8px' }}>
              <button
                onClick={() => onCategoryChange(null)}
                style={{
                  padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: '500', cursor: 'pointer',
                  backgroundColor: activeCategory === null ? 'var(--text-primary)' : 'var(--bg-input)',
                  color: activeCategory === null ? 'white' : 'var(--text-secondary)',
                  border: '1px solid ' + (activeCategory === null ? 'var(--text-primary)' : 'var(--border)'),
                }}
              >
                Tous ({pins.length})
              </button>
              {Object.entries(categories).map(([key, { label, color }]) => {
                const count = pins.filter(p => p.category === key).length
                if (count === 0) return null
                const isActive = activeCategory === key
                return (
                  <button key={key} onClick={() => onCategoryChange(isActive ? null : key)} style={{
                    padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: '500', cursor: 'pointer',
                    backgroundColor: isActive ? color : 'var(--bg-input)',
                    color: isActive ? 'white' : 'var(--text-secondary)',
                    border: '1px solid ' + (isActive ? color : 'var(--border)'),
                  }}>
                    {label} ({count})
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setSortOrder(s => s === 'desc' ? 'asc' : 'desc')}
              style={{ fontSize: '11px', color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <ClockIcon size={11} />
              {sortOrder === 'desc' ? 'Plus récent' : 'Plus ancien'}
            </button>
          </div>

          {/* Liste spots */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {sortedPins.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px', padding: '32px 16px' }}>Aucun spot</p>
            ) : sortedPins.map((pin) => {
              const isOwner = userId && pin.user_id === userId
              const commentCount = pin.comments?.length || 0
              const reactionCount = pin.reactions?.length || 0
              return (
                <div
                  key={pin.id}
                  onClick={() => onPinClick(pin)}
                  style={{ padding: '11px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-input)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: categories[pin.category]?.color || '#64748b', flexShrink: 0, marginTop: '5px' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                        <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pin.title}</p>
                        {isOwner && <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: '600', flexShrink: 0 }}>moi</span>}
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: '1px 0 0' }}>{pin.profiles?.username}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
                        {commentCount > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                            <MessageIcon />{commentCount}
                          </span>
                        )}
                        {reactionCount > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                            <ZapIcon />{reactionCount}
                          </span>
                        )}
                        {timeAgo(pin.created_at) && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                            <ClockIcon />{timeAgo(pin.created_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {activeTab === 'members' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {members.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px', padding: '32px 16px' }}>Chargement...</p>
          ) : members.map((m) => {
            const count = pins.filter(p => p.user_id === m.user_id).length
            const isActive = activeMember?.id === m.user_id
            return (
              <div
                key={m.user_id}
                onClick={() => onMemberFilter(isActive ? null : { id: m.user_id, username: m.profiles?.username })}
                style={{
                  padding: '11px 14px', borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  cursor: 'pointer',
                  backgroundColor: isActive ? 'var(--accent-light)' : 'transparent',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-input)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = isActive ? 'var(--accent-light)' : 'transparent' }}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  backgroundColor: isActive ? 'var(--accent)' : 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: '700',
                  color: isActive ? 'white' : 'var(--text-secondary)', flexShrink: 0,
                }}>
                  {m.profiles?.username?.[0]?.toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>{m.profiles?.username || 'Anonyme'}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>
                    {count} spot{count > 1 ? 's' : ''}{m.user_id === userId ? ' · vous' : ''}
                  </p>
                </div>
                {isActive && <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '600' }}>✓</span>}
              </div>
            )
          })}
          {activeMember && (
            <button onClick={() => onMemberFilter(null)} style={{ width: '100%', padding: '12px', fontSize: '12px', color: 'var(--text-tertiary)', background: 'none', border: 'none', borderTop: '1px solid var(--border)', cursor: 'pointer' }}>
              Voir tous les spots
            </button>
          )}
        </div>
      )}
    </div>
  )
}