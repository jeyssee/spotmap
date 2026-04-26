import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

const PinIcon = ({ size = 20, color = 'var(--accent)' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
)
const UsersIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const ClockIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const CopyIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
)
const EditIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const TrashIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)
const LogOutIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)
const PlusIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const DoorIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 4h3a2 2 0 0 1 2 2v14"/><path d="M2 20h3"/><path d="M13 20h9"/>
    <path d="M10 12v.01"/><path d="M13 4l-6 2v14l6 2V4z"/>
  </svg>
)
const MapIcon = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
    <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
  </svg>
)

export default function Groups({ session }) {
  const [groups, setGroups] = useState([])
  const [groupStats, setGroupStats] = useState({})
  const [newGroupName, setNewGroupName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [profile, setProfile] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [copiedCode, setCopiedCode] = useState(null)
  const [renamingGroup, setRenamingGroup] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [lastVisit, setLastVisit] = useState({})
  const [navReady, setNavReady] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchGroups()
    fetchProfile()
    const stored = JSON.parse(localStorage.getItem('spotmap_last_visit') || '{}')
    setLastVisit(stored)
    // Déclenche l'animation navbar après le mount
    setTimeout(() => setNavReady(true), 100)
  }, [])

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    setProfile(data)
    setNewUsername(data?.username || '')
  }

  const fetchGroups = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('group_members').select('groups(*)').eq('user_id', session.user.id).order('joined_at', { ascending: false })
    if (error) { setError(error.message); setLoading(false); return }
    const groupList = data.map(d => d.groups).filter(Boolean)
    const stats = {}
    await Promise.all(groupList.map(async (g) => {
      const [membersRes, pinsRes] = await Promise.all([
        supabase.from('group_members').select('user_id', { count: 'exact' }).eq('group_id', g.id),
        supabase.from('pins').select('title, created_at').eq('group_id', g.id).order('created_at', { ascending: false })
      ])
      stats[g.id] = {
        memberCount: membersRes.count || 0,
        pinCount: pinsRes.data?.length || 0,
        lastPin: pinsRes.data?.[0] || null,
      }
    }))
    setGroupStats(stats)
    const stored = JSON.parse(localStorage.getItem('spotmap_last_visit') || '{}')
    const sorted = [...groupList].sort((a, b) => {
      const va = stored[a.id] ? new Date(stored[a.id]) : new Date(0)
      const vb = stored[b.id] ? new Date(stored[b.id]) : new Date(0)
      return vb - va
    })
    setGroups(sorted)
    setLoading(false)
  }

  const markVisited = (groupId) => {
    const updated = { ...lastVisit, [groupId]: new Date().toISOString() }
    setLastVisit(updated)
    localStorage.setItem('spotmap_last_visit', JSON.stringify(updated))
  }

  const hasNewSpots = (group) => {
    const stats = groupStats[group.id]
    if (!stats?.lastPin) return false
    const last = lastVisit[group.id]
    if (!last) return true
    return new Date(stats.lastPin.created_at) > new Date(last)
  }

  const createGroup = async (e) => {
    e.preventDefault(); setError(null)
    const { data, error } = await supabase.from('groups').insert({ name: newGroupName, created_by: session.user.id }).select().single()
    if (error) { setError(error.message); return }
    await supabase.from('group_members').insert({ group_id: data.id, user_id: session.user.id })
    setNewGroupName(''); setShowCreate(false); fetchGroups()
  }

  const joinGroup = async (e) => {
    e.preventDefault(); setError(null)
    const { data: group, error: findError } = await supabase.from('groups').select('*').eq('invite_code', joinCode.trim().toLowerCase()).maybeSingle()
    if (findError || !group) { setError('Code invalide ou groupe introuvable'); return }
    const { error: joinError } = await supabase.from('group_members').insert({ group_id: group.id, user_id: session.user.id })
    if (joinError) { setError(joinError.message.includes('duplicate') ? 'Vous faites déjà partie de ce groupe !' : joinError.message); return }
    setJoinCode(''); setShowJoin(false); fetchGroups()
  }

  const copyCode = (e, code, groupId) => {
    e.stopPropagation()
    navigator.clipboard.writeText(code).then(() => { setCopiedCode(groupId); setTimeout(() => setCopiedCode(null), 2000) })
  }

  const leaveGroup = async (e, groupId) => {
    e.stopPropagation()
    if (!confirm('Quitter ce groupe ?')) return
    await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', session.user.id)
    fetchGroups()
  }

  const deleteGroup = async (e, groupId) => {
    e.stopPropagation()
    if (!confirm('Supprimer ce groupe et tous ses spots ? Cette action est irréversible.')) return
    await supabase.from('groups').delete().eq('id', groupId); fetchGroups()
  }

  const startRename = (e, group) => { e.stopPropagation(); setRenamingGroup(group.id); setRenameValue(group.name) }

  const saveRename = async (e, groupId) => {
    e.preventDefault(); e.stopPropagation()
    await supabase.from('groups').update({ name: renameValue }).eq('id', groupId)
    setRenamingGroup(null); fetchGroups()
  }

  const saveProfile = async (e) => {
    e.preventDefault(); setSavingProfile(true)
    await supabase.from('profiles').update({ username: newUsername }).eq('id', session.user.id)
    await fetchProfile(); setSavingProfile(false); setShowProfile(false)
  }

  const signOut = async () => await supabase.auth.signOut()
  const closeCreate = () => { setShowCreate(false); setNewGroupName(''); setError(null) }
  const closeJoin = () => { setShowJoin(false); setJoinCode(''); setError(null) }

  const inputClass = 'w-full px-4 py-2.5 bg-[#F8F8F8] border border-[#EEEEEE] rounded-xl text-sm text-[#111111] placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition'

  const actionBtn = {
    display: 'flex', alignItems: 'center', gap: '5px',
    fontSize: '12px', fontWeight: '500',
    backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)',
    border: '1px solid var(--border)', borderRadius: '100px',
    padding: '5px 12px', cursor: 'pointer',
  }

  const dangerBtn = {
    ...actionBtn,
    backgroundColor: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA',
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)', position: 'relative', overflow: 'hidden' }}>

      {/* Orbes en fond */}
      <div className="absolute rounded-full pointer-events-none orb-1" style={{
        width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(255,128,69,0.15) 0%, rgba(255,128,69,0) 70%)',
        top: '-100px', left: '-150px',
      }} />
      <div className="absolute rounded-full pointer-events-none orb-2" style={{
        width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(255,128,69,0.12) 0%, rgba(255,128,69,0) 70%)',
        bottom: '-80px', right: '-100px',
      }} />
      <div className="absolute rounded-full pointer-events-none orb-3" style={{
        width: '300px', height: '300px',
        background: 'radial-gradient(circle, rgba(255,128,69,0.08) 0%, rgba(255,128,69,0) 70%)',
        top: '40%', right: '5%',
      }} />

      {/* Navbar flottante animée */}
      <div style={{ padding: '16px 16px 0', position: 'relative', zIndex: 10 }}>
        <nav style={{
  backgroundColor: 'var(--bg-card)',
  borderRadius: '100px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  border: '1px solid var(--border)',
  padding: '10px 20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  overflow: 'hidden',
}}>
          {/* Logo */}
          <div className="nav-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', animationDelay: '0.4s' }}>
            <PinIcon size={22} />
            <span className="logo-text" style={{ fontSize: '16px', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>SpotMap</span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="nav-item"
              onClick={() => setShowCreate(true)}
              style={{
                animationDelay: '0.5s',
                display: 'flex', alignItems: 'center', gap: '6px',
                backgroundColor: 'var(--accent)', color: 'white',
                border: 'none', borderRadius: '100px',
                padding: '8px 16px', fontSize: '13px', fontWeight: '600',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              <PlusIcon size={14} />
              Créer
            </button>
            <button
              className="nav-item"
              onClick={() => setShowJoin(true)}
              style={{
                animationDelay: '0.6s',
                display: 'flex', alignItems: 'center', gap: '6px',
                backgroundColor: 'transparent', color: 'var(--text-primary)',
                border: '1px solid var(--border)', borderRadius: '100px',
                padding: '8px 16px', fontSize: '13px', fontWeight: '500',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              Rejoindre
            </button>
            <button
              className="nav-item"
              onClick={() => setShowProfile(true)}
              style={{
                animationDelay: '0.7s',
                width: '36px', height: '36px', borderRadius: '50%',
                backgroundColor: 'var(--accent)', color: 'white',
                border: 'none', fontWeight: '700', fontSize: '14px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {profile?.username?.[0]?.toUpperCase() || '?'}
            </button>
          </div>
        </nav>
      </div>

      {/* Contenu */}
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 16px', position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Mes groupes</h2>
          {groups.length > 0 && (
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              {groups.length} groupe{groups.length > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '40px 0' }}>Chargement...</p>
        ) : groups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <MapIcon size={40} />
            <p style={{ color: 'var(--text-tertiary)', marginTop: '16px', fontSize: '15px' }}>Aucun groupe pour l'instant</p>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', marginTop: '4px' }}>Crée ou rejoins un groupe pour commencer</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {groups.map((group, i) => {
              const stats = groupStats[group.id]
              const isCreator = group.created_by === session.user.id
              const isNew = hasNewSpots(group)

              return (
                <div
                  key={group.id}
                  className="card-anim"
                  style={{
                    animationDelay: `${i * 80}ms`,
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '20px',
                    padding: '20px',
                    cursor: 'pointer',
                    position: 'relative',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                  }}
                  onClick={() => { markVisited(group.id); navigate(`/group/${group.id}`) }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  {isNew && (
                    <div style={{
                      position: 'absolute', top: '20px', right: '20px',
                      backgroundColor: 'var(--accent-light)', color: 'var(--accent)',
                      fontSize: '11px', fontWeight: '600',
                      padding: '3px 10px', borderRadius: '100px',
                      border: '1px solid var(--accent-border)',
                      display: 'flex', alignItems: 'center', gap: '5px',
                    }}>
                      <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--accent)', borderRadius: '50%', display: 'inline-block' }} />
                      Nouveauté
                    </div>
                  )}

                  <div style={{ marginBottom: '12px', paddingRight: isNew ? '100px' : '0' }}>
                    {renamingGroup === group.id ? (
                      <form onSubmit={(e) => saveRename(e, group.id)} onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: '8px' }}>
                        <input type="text" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} autoFocus className={inputClass} style={{ flex: 1 }} />
                        <button type="submit" style={{ backgroundColor: 'var(--accent)', color: 'white', border: 'none', borderRadius: '10px', padding: '0 14px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>OK</button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setRenamingGroup(null) }} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '18px' }}>✕</button>
                      </form>
                    ) : (
                      <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>{group.name}</h3>
                    )}
                  </div>

                  {stats && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <PinIcon size={14} color="var(--text-tertiary)" />{stats.pinCount} spot{stats.pinCount > 1 ? 's' : ''}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <UsersIcon size={14} />{stats.memberCount} membre{stats.memberCount > 1 ? 's' : ''}
                      </span>
                      {stats?.lastPin && timeAgo(stats.lastPin.created_at) && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text-tertiary)' }}>
                          <ClockIcon size={13} />{timeAgo(stats.lastPin.created_at)}
                        </span>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
                    <button onClick={(e) => copyCode(e, group.invite_code, group.id)} style={actionBtn}>
                      <CopyIcon size={12} />{copiedCode === group.id ? 'Copié !' : 'Inviter'}
                    </button>
                    {isCreator && (
                      <button onClick={(e) => startRename(e, group)} style={actionBtn}>
                        <EditIcon size={12} />Renommer
                      </button>
                    )}
                    {!isCreator && (
                      <button onClick={(e) => leaveGroup(e, group.id)} style={dangerBtn}>
                        <DoorIcon size={12} />Quitter
                      </button>
                    )}
                    {isCreator && (
                      <button onClick={(e) => deleteGroup(e, group.id)} style={dangerBtn}>
                        <TrashIcon size={12} />Supprimer
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Créer */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }} onClick={closeCreate}>
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '24px', padding: '28px', width: '100%', maxWidth: '380px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', animation: 'fadeUp 0.25s ease forwards' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Créer un groupe</h2>
              <button onClick={closeCreate} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>
            <form onSubmit={createGroup} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="text" placeholder="Nom du groupe" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} required autoFocus className={inputClass} />
              {error && <p style={{ color: '#EF4444', fontSize: '13px', margin: 0 }}>{error}</p>}
              <button type="submit" style={{ backgroundColor: 'var(--accent)', color: 'white', border: 'none', borderRadius: '12px', padding: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Créer</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Rejoindre */}
      {showJoin && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }} onClick={closeJoin}>
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '24px', padding: '28px', width: '100%', maxWidth: '380px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', animation: 'fadeUp 0.25s ease forwards' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Rejoindre un groupe</h2>
              <button onClick={closeJoin} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>
            <form onSubmit={joinGroup} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="text" placeholder="Code d'invitation" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} required autoFocus className={inputClass} />
              {error && <p style={{ color: '#EF4444', fontSize: '13px', margin: 0 }}>{error}</p>}
              <button type="submit" style={{ backgroundColor: 'var(--text-primary)', color: 'white', border: 'none', borderRadius: '12px', padding: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Rejoindre</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Profil */}
      {showProfile && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }} onClick={() => setShowProfile(false)}>
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '24px', padding: '28px', width: '100%', maxWidth: '380px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', animation: 'fadeUp 0.25s ease forwards' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Mon profil</h2>
              <button onClick={() => setShowProfile(false)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px', fontWeight: '700' }}>
                {profile?.username?.[0]?.toUpperCase() || '?'}
              </div>
            </div>
            <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nom d'utilisateur</label>
                <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} required className={inputClass} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
                <input type="text" value={session.user.email} disabled className={inputClass} style={{ opacity: 0.5, cursor: 'not-allowed' }} />
              </div>
              <button type="submit" disabled={savingProfile} style={{ backgroundColor: 'var(--accent)', color: 'white', border: 'none', borderRadius: '12px', padding: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', opacity: savingProfile ? 0.5 : 1 }}>
                {savingProfile ? 'Enregistrement...' : 'Sauvegarder'}
              </button>
              <button type="button" onClick={signOut} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'none', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px', fontSize: '14px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <LogOutIcon size={15} />Déconnexion
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}