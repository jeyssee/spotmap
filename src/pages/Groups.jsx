import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Groups({ session }) {
  const [groups, setGroups] = useState([])
  const [newGroupName, setNewGroupName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [profile, setProfile] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchGroups()
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
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

  if (error) {
    setError(error.message)
  } else {
    setGroups(data.map(d => d.groups).filter(Boolean))
  }
  setLoading(false)
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
    if (joinError && !joinError.message.includes('duplicate')) { setError(joinError.message); return }
    setJoinCode('')
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

      {loading ? (
        <p className="text-slate-500">Chargement...</p>
      ) : groups.length === 0 ? (
        <p className="text-slate-500 text-center py-8">Aucun groupe pour l'instant. Crée ou rejoins-en un !</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-white p-6 rounded-xl shadow hover:shadow-md transition cursor-pointer"
              onClick={() => navigate(`/group/${group.id}`)}
            >
              <h3 className="font-semibold text-lg text-slate-900 mb-2">{group.name}</h3>
              <p className="text-xs text-slate-500">
                Code : <span className="font-mono bg-slate-100 px-2 py-1 rounded">{group.invite_code}</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}