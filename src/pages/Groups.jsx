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

export default function Groups({ session }) {
  const [groups, setGroups] = useState([])
  const [groupStats, setGroupStats] = useState({})
  const [newGroupName, setNewGroupName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [profile, setProfile] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [copiedCode, setCopiedCode] = useState(null)
  const [renamingGroup, setRenamingGroup] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [lastVisit, setLastVisit] = useState({})
  const navigate = useNavigate()

  useEffect(() => {
    fetchGroups()
    fetchProfile()
    // Charge les dernières visites depuis localStorage
    const stored = JSON.parse(localStorage.getItem('spotmap_last_visit') || '{}')
    setLastVisit(stored)
  }, [])

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    setProfile(data)
    setNewUsername(data?.username || '')
  }

  const fetchGroups = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('group_members')
      .select('groups(*)')
      .eq('user_id', session.user.id)
      .order('joined_at', { ascending: false })

    if (error) { setError(error.message); setLoading(false); return }

    const groupList = data.map(d => d.groups).filter(Boolean)
    setGroups(groupList)

    // Récupère les stats pour chaque groupe
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
    e.preventDefault()
    setError(null)
    const { data, error } = await supabase
      .from('groups')
      .insert({ name: newGroupName, created_by: session.user.id })
      .select().single()
    if (error) { setError(error.message); return }
    await supabase.from('group_members').insert({ group_id: data.id, user_id: session.user.id })
    setNewGroupName('')
    fetchGroups()
  }

  const joinGroup = async (e) => {
  e.preventDefault()
  setError(null)
  const { data: group, error: findError } = await supabase
    .from('groups').select('*').eq('invite_code', joinCode.trim().toLowerCase()).maybeSingle()
  if (findError || !group) { setError('Code invalide ou groupe introuvable'); return }

  const { error: joinError } = await supabase
    .from('group_members').insert({ group_id: group.id, user_id: session.user.id })

  if (joinError) {
    if (joinError.message.includes('duplicate')) {
      setError('Vous faites déjà partie de ce groupe !')
    } else {
      setError(joinError.message)
    }
    return
  }

  setJoinCode('')
  fetchGroups()
}

  const copyCode = (e, code, groupId) => {
    e.stopPropagation()
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(groupId)
      setTimeout(() => setCopiedCode(null), 2000)
    })
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
    await supabase.from('groups').delete().eq('id', groupId)
    fetchGroups()
  }

  const startRename = (e, group) => {
    e.stopPropagation()
    setRenamingGroup(group.id)
    setRenameValue(group.name)
  }

  const saveRename = async (e, groupId) => {
    e.preventDefault()
    e.stopPropagation()
    await supabase.from('groups').update({ name: renameValue }).eq('id', groupId)
    setRenamingGroup(null)
    fetchGroups()
  }

  const saveProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    await supabase.from('profiles').update({ username: newUsername }).eq('id', session.user.id)
    await fetchProfile()
    setSavingProfile(false)
    setShowProfile(false)
  }

  const signOut = async () => await supabase.auth.signOut()

  return (
    <div className="min-h-full p-4 md:p-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">🗺️ SpotMap</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition"
          >
            <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
              {profile?.username?.[0]?.toUpperCase() || '?'}
            </div>
            <span className="text-sm text-slate-700">{profile?.username || 'Profil'}</span>
          </button>
          <button onClick={signOut} className="text-sm text-slate-500 hover:text-slate-700">Déconnexion</button>
        </div>
      </div>

      {/* Modal profil */}
      {showProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg text-slate-900">Mon profil</h2>
              <button onClick={() => setShowProfile(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                {profile?.username?.[0]?.toUpperCase() || '?'}
              </div>
            </div>
            <form onSubmit={saveProfile} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Nom d'utilisateur</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Email</label>
                <input
                  type="text"
                  value={session.user.email}
                  disabled
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-400"
                />
              </div>
              <button
                type="submit"
                disabled={savingProfile}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {savingProfile ? 'Enregistrement...' : 'Sauvegarder'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Créer / rejoindre */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <form onSubmit={createGroup} className="bg-white p-6 rounded-xl shadow">
          <h2 className="font-semibold mb-4 text-slate-800">Créer un groupe</h2>
          <input
            type="text"
            placeholder="Nom du groupe (ex: Les potes Paris)"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-lg mb-3"
          />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
            Créer
          </button>
        </form>

        <form onSubmit={joinGroup} className="bg-white p-6 rounded-xl shadow">
          <h2 className="font-semibold mb-4 text-slate-800">Rejoindre un groupe</h2>
          <input
            type="text"
            placeholder="Code d'invitation"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-lg mb-3"
          />
          <button type="submit" className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition">
            Rejoindre
          </button>
        </form>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Liste des groupes */}
      {loading ? (
        <p className="text-slate-500">Chargement...</p>
      ) : groups.length === 0 ? (
        <p className="text-slate-500 text-center py-8">Aucun groupe pour l'instant. Crée ou rejoins-en un !</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {groups.map((group) => {
            const stats = groupStats[group.id]
            const isCreator = group.created_by === session.user.id
            const isNew = hasNewSpots(group)

            return (
              <div
                key={group.id}
                className="bg-white p-5 rounded-xl shadow hover:shadow-md transition cursor-pointer relative"
                onClick={() => { markVisited(group.id); navigate(`/group/${group.id}`) }}
              >
                {/* Badge nouveauté */}
                {isNew && (
  <span className="absolute top-4 right-4 flex items-center gap-1 bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">
    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full inline-block" />
    Nouveauté
  </span>
)}

                {/* Nom du groupe — renommable */}
                <div className="mb-2">
                  {renamingGroup === group.id ? (
                    <form onSubmit={(e) => saveRename(e, group.id)} onClick={e => e.stopPropagation()} className="flex gap-2">
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        autoFocus
                        className="flex-1 px-2 py-1 border border-blue-400 rounded text-sm focus:outline-none"
                      />
                      <button type="submit" className="text-xs bg-blue-600 text-white px-2 py-1 rounded">OK</button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setRenamingGroup(null) }} className="text-xs text-slate-400">✕</button>
                    </form>
                  ) : (
                    <h3 className="font-semibold text-lg text-slate-900">{group.name}</h3>
                  )}
                </div>

                {/* Stats */}
                {stats && (
                  <p className="text-xs text-slate-500 mb-1">
                    {stats.pinCount} spot{stats.pinCount > 1 ? 's' : ''} · {stats.memberCount} membre{stats.memberCount > 1 ? 's' : ''}
                  </p>
                )}

                {stats?.lastPin && timeAgo(stats.lastPin.created_at) && (
  <p className="text-xs text-slate-400 mb-3">
    Dernier spot · {timeAgo(stats.lastPin.created_at)}
  </p>
)}

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
                  {/* Copier le code */}
                  <button
                    onClick={(e) => copyCode(e, group.invite_code, group.id)}
                    className="flex items-center gap-1 text-xs bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition"
                  >
                    {copiedCode === group.id ? '✅ Copié !' : '📋 Inviter'}
                  </button>

                  {/* Renommer — créateur seulement */}
                  {isCreator && (
                    <button
                      onClick={(e) => startRename(e, group)}
                      className="flex items-center gap-1 text-xs bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition"
                    >
                      ✏️ Renommer
                    </button>
                  )}

                  {/* Quitter — non créateur */}
                  {!isCreator && (
                    <button
                      onClick={(e) => leaveGroup(e, group.id)}
                      className="flex items-center gap-1 text-xs bg-red-50 hover:bg-red-100 text-red-500 px-2.5 py-1.5 rounded-lg transition"
                    >
                      🚪 Quitter
                    </button>
                  )}

                  {/* Supprimer — créateur seulement */}
                  {isCreator && (
                    <button
                      onClick={(e) => deleteGroup(e, group.id)}
                      className="flex items-center gap-1 text-xs bg-red-50 hover:bg-red-100 text-red-500 px-2.5 py-1.5 rounded-lg transition"
                    >
                      🗑️ Supprimer
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}